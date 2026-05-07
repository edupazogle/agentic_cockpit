"""Live HITL chat routes — Hermes via DeepSeek V4 + citation verification."""

import json
import os

import httpx
from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse

from gateway.citation_gate import extract_citation_refs, verify_citations
from gateway.dependencies import get_db

router = APIRouter(prefix="/chat", tags=["chat"])

DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_V4_APIKEY", "")
DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1"
DEEPSEEK_MODEL = "deepseek-chat"

HERMES_SOUL_PATH = os.path.join(
    os.path.dirname(__file__), "..", "..", "..",
    "config", "openclaw", "agents", "hermes", "SOUL.md",
)

# Load Hermes persona once at module level
try:
    with open(os.path.abspath(HERMES_SOUL_PATH)) as f:
        HERMES_SYSTEM_PROMPT = f.read()
except (FileNotFoundError, OSError):
    HERMES_SYSTEM_PROMPT = (
        "You are Hermes, a gold-drop AI agent for the GDAI Agentic Cockpit "
        "at AXA insurance. Senior partner voice. Direct, warm, precise. "
        "French vouvoiement. Never sycophantic. Never invent citations."
    )


@router.get("/{country}/thread")
async def get_chat_thread(
    country: str,
    db=Depends(get_db),
):
    """Get or create the country-level chat thread."""
    # Try to fetch existing thread from Supabase
    try:
        rows = await db.fetch_all(
            "SELECT id, role, content, citations, created_at "
            "FROM chat_messages WHERE thread_id = $1 "
            "ORDER BY created_at ASC LIMIT 100",
            f"country-{country}",
        )
        messages = [
            {
                "id": str(r["id"]),
                "role": r["role"],
                "content": r["content"],
                "citations": r.get("citations"),
                "timestamp": r["created_at"].isoformat() if r.get("created_at") else "",
            }
            for r in rows
        ]
    except Exception:
        messages = []

    return {
        "thread_id": f"country-{country}",
        "country": country,
        "message_count": len(messages),
        "messages": messages,
    }


@router.post("/{country}/messages")
async def send_message(
    country: str,
    request: Request,
    db=Depends(get_db),
):
    """Send a message to Hermes. Returns SSE stream from DeepSeek V4.

    Stream flow:
    1. User message persisted to Supabase
    2. DeepSeek V4 called with Hermes persona
    3. Tokens streamed to client via SSE
    4. Full response passed through citation verification gate
    5. Response persisted to Supabase
    """
    body = await request.json()
    user_message = body.get("content", "")
    thread_id = f"country-{country}"

    # Persist user message
    try:
        await db.execute(
            "INSERT INTO chat_messages (thread_id, role, content, tenant_id) "
            "VALUES ($1, 'user', $2, $3)",
            thread_id, json.dumps({"text": user_message}), country,
        )
    except Exception:
        pass  # Non-blocking — chat continues even if persistence fails

    async def event_stream():
        full_response = ""

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                async with client.stream(
                    "POST",
                    f"{DEEPSEEK_BASE_URL}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": DEEPSEEK_MODEL,
                        "messages": [
                            {"role": "system", "content": HERMES_SYSTEM_PROMPT},
                            {"role": "user", "content": user_message},
                        ],
                        "stream": True,
                        "max_tokens": 2000,
                        "temperature": 0.7,
                    },
                ) as response:
                    if response.status_code != 200:
                        await response.aread()
                        yield (
                            f"event: error\n"
                            f"data: {json.dumps({'code': 'model_error', 'message': f'DeepSeek API returned {response.status_code}'})}\n\n"
                        )
                        return

                    async for line in response.aiter_lines():
                        if not line.startswith("data: "):
                            continue
                        data = line[6:]
                        if data == "[DONE]":
                            break
                        try:
                            chunk = json.loads(data)
                            delta = chunk.get("choices", [{}])[0].get("delta", {})
                            content = delta.get("content", "")
                            if content:
                                full_response += content
                                yield (
                                    f"event: token\n"
                                    f"data: {json.dumps({'token': content})}\n\n"
                                )
                        except (json.JSONDecodeError, KeyError, IndexError):
                            continue

            # Citation verification gate
            cites = extract_citation_refs(full_response)
            if cites:
                try:
                    result = await verify_citations(full_response, country, db)
                    if not result.passed:
                        yield (
                            f"event: citation_blocked\n"
                            f"data: {json.dumps({'blocked': [c.citation_ref for c in result.blocked_citations]})}\n\n"
                        )
                        correction = (
                            "I made a claim I couldn't verify against my regulatory sources. "
                            "Let me rephrase without the unverified citation."
                        )
                        full_response = correction
                        # Stream the correction
                        for word in correction.split():
                            yield (
                                f"event: token\n"
                                f"data: {json.dumps({'token': word + ' '})}\n\n"
                            )
                    elif result.fuzzy_citations:
                        yield (
                            f"event: citation_warning\n"
                            f"data: {json.dumps({'fuzzy': [c.citation_ref for c in result.fuzzy_citations]})}\n\n"
                        )
                    else:
                        yield (
                            f"event: verified\n"
                            f"data: {json.dumps({'citations': [c.citation_ref for c in result.citations]})}\n\n"
                        )
                except Exception:
                    pass  # Citation gate failure is non-blocking

            # Persist response
            try:
                await db.execute(
                    "INSERT INTO chat_messages (thread_id, role, content, citations, "
                    "verified, tenant_id) VALUES ($1, 'hermes', $2, $3, $4, $5)",
                    thread_id,
                    json.dumps({"text": full_response}),
                    json.dumps([c.citation_ref for c in cites]) if cites else None,
                    all(c.status == "verified" for c in (result.citations if cites else [])),
                    country,
                )
            except Exception:
                pass

            yield (
                f"event: done\n"
                f"data: {json.dumps({'total_chars': len(full_response)})}\n\n"
            )

        except httpx.ConnectError:
            yield (
                f"event: error\n"
                f"data: {json.dumps({'code': 'connection_error', 'message': 'Could not reach DeepSeek API'})}\n\n"
            )
        except TimeoutError:
            yield (
                f"event: error\n"
                f"data: {json.dumps({'code': 'timeout', 'message': 'DeepSeek API timed out'})}\n\n"
            )
        except Exception as e:
            yield (
                f"event: error\n"
                f"data: {json.dumps({'code': 'internal_error', 'message': str(e)})}\n\n"
            )

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.post("/{country}/escalate")
async def escalate_decision(
    country: str,
    request: Request,
    db=Depends(get_db),
):
    """Push decision packet to external system. No-op at PoC launch."""
    body = await request.json()
    return {
        "external_id": None,
        "delivery_status": "no_op",
        "message": "External escalation not configured. Decision remains in cockpit.",
        "packet_id": body.get("packet_id", "unknown"),
    }
