from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from uuid import UUID

PROMPTS_DIR = Path(__file__).resolve().parents[4] / "prompts" / "compagnon" / "exit_criteria"


@dataclass
class ExitCriteriaResult:
    met: bool
    missing: list[dict]
    suggested_questions: list[str] = field(default_factory=list)


def _load_contract(movement: str) -> dict:
    path = PROMPTS_DIR / f"{movement}.json"
    if not path.exists():
        raise ValueError(f"unknown movement: {movement}")
    return json.loads(path.read_text())


def eval_exit_criteria(
    db, *, pilot_id: UUID, movement: str, tenant_id: str
) -> ExitCriteriaResult:
    contract = _load_contract(movement)
    missing = []
    questions = []
    for check in contract['checks']:
        ok, ctx = _evaluate_check(db, pilot_id, tenant_id, check)
        if not ok:
            missing.append({'id': check['id'], **ctx})
            q = check['question_when_missing'].format(
                **{**ctx, 'current': ctx.get('current', 0)}
            )
            questions.append(q)
    return ExitCriteriaResult(
        met=len(missing) == 0, missing=missing, suggested_questions=questions
    )


def _evaluate_check(
    db, pilot_id: UUID, tenant_id: str, check: dict
) -> tuple[bool, dict]:
    kind = check['kind']
    if kind == 'count':
        n = db.execute(
            "select count(*) from pilot_artifact "
            "where pilot_id=%s and tenant_id=%s and kind=%s and retired_at is null",
            (pilot_id, tenant_id, check['artifact_kind']),
        ).scalar_one()
        return (n >= check['min'], {'current': n, 'min': check['min']})
    if kind == 'fields_present':
        rows = db.execute(
            "select content from pilot_artifact "
            "where pilot_id=%s and tenant_id=%s and kind=%s and retired_at is null",
            (pilot_id, tenant_id, check['artifact_kind']),
        ).fetchall()
        missing_count = 0
        first_missing_field = None
        for (content,) in rows:
            for f in check['required_fields']:
                if f not in (content or {}) or content[f] in (None, ''):
                    missing_count += 1
                    first_missing_field = first_missing_field or f
                    break
        return (
            missing_count == 0,
            {
                'missing_count': missing_count,
                'field': first_missing_field or check['required_fields'][0],
            },
        )
    if kind == 'per_module':
        rows = db.execute(
            "select pm.id, pm.uc_code, count(pa.id) "
            "from pilot_module pm left join pilot_artifact pa "
            "  on pa.module_id=pm.id and pa.kind=%s and pa.retired_at is null "
            "where pm.pilot_id=%s and pm.tenant_id=%s "
            "group by pm.id, pm.uc_code",
            (check['artifact_kind'], pilot_id, tenant_id),
        ).fetchall()
        if not rows:
            return (False, {'module': '<no module>', 'current': 0})
        for _mid, uc, n in rows:
            if n < check['min_per_module']:
                return (False, {'module': uc, 'current': n})
        return (True, {})
    if kind == 'tension_check':
        return (True, {})
    raise ValueError(f"unknown check kind: {kind}")
