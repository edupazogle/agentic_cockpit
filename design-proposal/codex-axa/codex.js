// Codex — pinned scroll reveals, canvas pan/zoom, SIM engine for canvas page
document.addEventListener('DOMContentLoaded', () => {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => e.isIntersecting && e.target.classList.add('in'));
  }, { threshold: 0.06 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
});

// ─── Canvas pan/zoom ──────────────────────────────────────────────────
function initCanvasC(panEl) {
  const stage = panEl.parentElement;
  let scale = 1, tx = 0, ty = 0;
  let isPan = false, sx = 0, sy = 0, ox = 0, oy = 0;

  const apply = () => {
    panEl.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    const r = document.querySelector('.zoombar-c .r');
    if (r) r.textContent = `${Math.round(scale * 100)}%`;
    const bg = document.querySelector('.canvas-bg-c');
    if (bg) {
      const sz = 80 * scale;
      bg.style.backgroundSize = `${sz}px ${sz}px`;
    }
    if (window.CodexSim && CodexSim.redraw) CodexSim.redraw();
  };

  stage.addEventListener('mousedown', (e) => {
    if (e.target.closest('.node-c, .runhead-c, .inspector-c, .activity-c, .hitl-banner, .minimap-c, .zoombar-c, .reading')) return;
    isPan = true; sx = e.clientX; sy = e.clientY; ox = tx; oy = ty;
    stage.style.cursor = 'grabbing';
  });
  window.addEventListener('mousemove', (e) => {
    if (!isPan) return;
    tx = ox + (e.clientX - sx); ty = oy + (e.clientY - sy);
    apply();
  });
  window.addEventListener('mouseup', () => { isPan = false; stage.style.cursor = ''; });

  stage.addEventListener('wheel', (e) => {
    if (e.target.closest('.runhead-c, .inspector-c, .activity-c, .hitl-banner, .minimap-c, .zoombar-c, .reading')) return;
    e.preventDefault();
    const r = stage.getBoundingClientRect();
    const px = e.clientX - r.left, py = e.clientY - r.top;
    const next = Math.min(2, Math.max(0.4, scale - e.deltaY * 0.0015));
    const k = next / scale;
    tx = px - (px - tx) * k; ty = py - (py - ty) * k; scale = next;
    apply();
  }, { passive: false });

  document.querySelectorAll('[data-zc]').forEach(b => b.addEventListener('click', () => {
    const dir = b.dataset.zc;
    const r = stage.getBoundingClientRect();
    const px = r.width/2, py = r.height/2;
    const next = Math.min(2, Math.max(0.4, dir === 'in' ? scale * 1.2 : dir === 'out' ? scale / 1.2 : 1));
    if (dir === 'fit') {
      // fit-all: scale to fit all cards in the usable canvas (excludes inspector + runhead overlays)
      const cards = panEl.querySelectorAll('.node-c');
      let maxX = 0, maxY = 0;
      cards.forEach(c => {
        const x = parseFloat(c.style.left || 0) + c.offsetWidth;
        const y = parseFloat(c.style.top || 0)  + c.offsetHeight;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      });
      const pr = panEl.getBoundingClientRect();
      const inspector = document.querySelector('.inspector-c');
      const insW = inspector && inspector.offsetParent ? inspector.offsetWidth + 48 : 24;
      const usableW = pr.width - insW - 24;
      const usableH = pr.height - 80;
      const sx = usableW / maxX;
      const sy = usableH / maxY;
      scale = Math.min(1, Math.min(sx, sy));
      tx = 24; ty = 24;
    } else {
      const k = next / scale; tx = px - (px - tx) * k; ty = py - (py - ty) * k; scale = next;
    }
    apply();
  }));

  // expose centering API for SIM auto-pan
  window.CodexCanvas = {
    centerOn(id) {
      const card = document.getElementById(id);
      if (!card) return;
      const cx = parseFloat(card.style.left || 0) + card.offsetWidth / 2;
      const cy = parseFloat(card.style.top  || 0) + card.offsetHeight / 2;
      const pr = panEl.getBoundingClientRect();
      tx = pr.width / 2 - cx * scale;
      ty = pr.height / 2 - cy * scale;
      apply();
    },
    fit() {
      const btn = document.querySelector('[data-zc="fit"]');
      if (btn) btn.click();
    }
  };

  apply();
}

// ─── Edge geometry — supports horizontal + vertical hops ──────────────
function nodeAnchor(node, side) {
  const pan = document.querySelector('.canvas-pan-c');
  const m = pan.style.transform.match(/scale\(([^)]+)\)/);
  const s = parseFloat(m?.[1] || '1');
  const pr = pan.getBoundingClientRect();
  const r = node.getBoundingClientRect();
  let x, y;
  if (side === 'right') { x = r.right; y = r.top + r.height/2; }
  else if (side === 'left') { x = r.left; y = r.top + r.height/2; }
  else if (side === 'top') { x = r.left + r.width/2; y = r.top; }
  else if (side === 'bottom') { x = r.left + r.width/2; y = r.bottom; }
  return { x: (x - pr.left) / s, y: (y - pr.top) / s };
}

function edgePath(a, b, mode) {
  if (mode === 'vertical') {
    const dy = Math.abs(b.y - a.y) * 0.55;
    return `M ${a.x} ${a.y} C ${a.x} ${a.y + dy}, ${b.x} ${b.y - dy}, ${b.x} ${b.y}`;
  }
  // horizontal (default)
  const dx = (b.x - a.x) * 0.55;
  return `M ${a.x} ${a.y} C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`;
}

function drawEdges(edges, svgEdges, svgParticles) {
  svgEdges.innerHTML = '';
  if (svgParticles) svgParticles.innerHTML = '';
  // Resize SVGs to the actual content extent (cards may extend beyond
  // the visible pan-c on an infinite canvas — size to max card x+width).
  const pan = document.querySelector('.canvas-pan-c');
  const visR = pan.getBoundingClientRect();
  const cards = pan.querySelectorAll('.node-c');
  let maxX = visR.width, maxY = visR.height;
  cards.forEach(c => {
    const x = parseFloat(c.style.left || 0) + c.offsetWidth + 32;
    const y = parseFloat(c.style.top || 0)  + c.offsetHeight + 32;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  });
  [svgEdges, svgParticles].forEach(s => { if (!s) return; s.setAttribute('viewBox', `0 0 ${maxX} ${maxY}`); s.style.width = maxX + 'px'; s.style.height = maxY + 'px'; });

  edges.forEach(({ from, to, kind, fromSide = 'right', toSide = 'left', mode = 'horizontal', id }) => {
    const af = document.querySelector('#' + from);
    const bt = document.querySelector('#' + to);
    if (!af || !bt) return;
    const a = nodeAnchor(af, fromSide);
    const b = nodeAnchor(bt, toSide);
    const d = edgePath(a, b, mode);

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'edge-g ' + (kind || ''));
    g.dataset.edge = id || `${from}__${to}`;

    // base path
    const base = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    base.setAttribute('d', d);
    base.setAttribute('class', 'edge-base');
    g.appendChild(base);

    // animated dashed overlay for live edges
    const live = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    live.setAttribute('d', d);
    live.setAttribute('class', 'edge-live');
    g.appendChild(live);

    svgEdges.appendChild(g);

    // Particle stream — three offset circles for live edges
    if (svgParticles && (kind === 'live' || kind === 'pulse')) {
      for (let i = 0; i < 3; i++) {
        const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        c.setAttribute('r', '2.4');
        c.setAttribute('class', 'edge-particle');
        const am = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion');
        am.setAttribute('dur', '1.4s');
        am.setAttribute('repeatCount', 'indefinite');
        am.setAttribute('begin', (i * 0.46) + 's');
        am.setAttribute('path', d);
        c.appendChild(am);
        svgParticles.appendChild(c);
      }
    }
  });
}

// ─── SIM engine — full PFT scenario faked end-to-end ─────────────────
const CodexSim = (() => {
  const STEPS = [
    { id: 'cn-presenter', name: 'Presenter',     stage: 'voice intake',  dur: 1400, mcps: [],
      activity: ['<strong>Presenter</strong> greeted claimant <em>· voice intake started</em>'],
      result: {} },
    { id: 'cn-rachel',    name: 'Rachel · FNOL', stage: 'capture facts', dur: 1600,
      mcps: [{ tool: 'claims_facade.create_claim', dur: 360 }],
      activity: ['<strong>Rachel</strong> captured facts <em>· claim CLM-2026-0042</em>'],
      result: {} },
    { id: 'cn-atlas',     name: 'Atlas · triage', stage: 'triage',        dur: 1900,
      mcps: [{ tool: 'weather.fetch', dur: 240 }, { tool: 'property.lookup', dur: 320 }],
      activity: ['<strong>Atlas</strong> estimated reserve <em>· €4,820 · severity HIGH</em>'],
      result: { 'cn-atlas': { severity: 'HIGH', reserve: '€4,820' }, 'cn-reserve': { requested: '€4,820' } } },
    { id: 'cn-reserve',   name: 'Reserve gate',  stage: 'HITL · reserve', hitl: true,
      banner: { node: 'Reserve gate', amount: '€4,820', desc: 'Atlas estimated reserve at <strong>€4,820</strong> — above the <strong>€2,000</strong> floor. Approve to proceed to evidence extraction.' },
      activity: ['<strong>Reserve gate</strong> awaiting operator <em>· €4,820 &gt; €2,000 floor</em>'],
      result: {} },
    { id: 'cn-docling',   name: 'Docling',       stage: 'evidence parse', dur: 1700,
      mcps: [{ tool: 'wf006.extract_document', dur: 520 }],
      activity: ['<strong>Docling</strong> extracted 3 photos + invoice <em>· OCR 0.94 mean</em>'],
      result: { 'cn-docling': { photos: '3 · OCR 0.94', invoice: 'Plomberie €4,820' } } },
    { id: 'cn-hermes',    name: 'Hermes review', stage: 'HITL · dossier', hitl: true,
      banner: { node: 'Hermes review', amount: 'dossier', desc: 'Adjuster compiled the dossier with <strong>3 photos · invoice · policy</strong>. Approve to dispatch the vendor and notify the claimant.' },
      activity: ['<strong>Hermes review</strong> awaiting operator <em>· dossier ready</em>'],
      result: { 'cn-hermes': { dossier: '6 artefacts' } } },
    { id: 'cn-adjuster',  name: 'Adjuster',      stage: 'compile dossier', dur: 1400,
      mcps: [{ tool: 'chatwoot.post', dur: 280 }],
      activity: ['<strong>Adjuster</strong> compiled dossier <em>· verdict: covered · €4,820</em>'],
      result: { 'cn-adjuster': { verdict: 'covered', amount: '€4,820' } } },
    { id: 'cn-harry',     name: 'Harry · vendor', stage: 'vendor dispatch', dur: 1500,
      mcps: [{ tool: 'wfmcp02-04.book_appointment', dur: 380 }],
      activity: ['<strong>Harry</strong> booked vendor <em>· Plomberie Lyon · 14:00 tomorrow</em>'],
      result: { 'cn-harry': { vendor: 'Plomberie Lyon', booking: '14:00 · tomorrow' } } },
  ];

  // Edges with snake topology: 1→2→3→4↓5←6←7←8
  const EDGES = [
    { from: 'cn-presenter', to: 'cn-rachel',   kind: 'queued', fromSide: 'right', toSide: 'left' },
    { from: 'cn-rachel',    to: 'cn-atlas',    kind: 'queued', fromSide: 'right', toSide: 'left' },
    { from: 'cn-atlas',     to: 'cn-reserve',  kind: 'queued', fromSide: 'right', toSide: 'left' },
    { from: 'cn-reserve',   to: 'cn-docling',  kind: 'queued', fromSide: 'right', toSide: 'left', mode: 'vertical' },
    { from: 'cn-docling',   to: 'cn-hermes',   kind: 'queued', fromSide: 'right', toSide: 'left' },
    { from: 'cn-hermes',    to: 'cn-adjuster', kind: 'queued', fromSide: 'right', toSide: 'left' },
    { from: 'cn-adjuster',  to: 'cn-harry',    kind: 'queued', fromSide: 'right', toSide: 'left' },
  ];

  // ─── runtime state ─────────────────────────────────────────────────
  const state = {
    phase: 'idle',  // idle | running | wait | done
    cursor: 0,      // index into STEPS
    elapsedMs: 0,
    startTs: 0,
    timer: null,
    cost: 0,
  };

  const $ = (id) => document.getElementById(id);
  const svgEdges = () => $('edges-c');
  const svgParticles = () => $('particles-c');

  function setNodeState(id, st, label) {
    const el = $(id);
    if (!el) return;
    el.classList.remove('queued', 'live', 'wait', 'done');
    el.classList.add(st);
    const sp = el.querySelector('.status-pill');
    if (sp) sp.innerHTML = `<span class="pip ${st === 'done' ? 'done' : st === 'wait' ? 'hitl' : st === 'live' ? 'live' : ''}"></span><span class="sl">${label || st}</span>`;
    if (st === 'live' || st === 'wait') {
      document.querySelectorAll('.node-c.selected').forEach(n => n.classList.remove('selected'));
      el.classList.add('selected');
    }
  }

  function setEdgeKind(fromId, toId, kind) {
    const ed = EDGES.find(e => e.from === fromId && e.to === toId);
    if (ed) ed.kind = kind;
    drawEdges(EDGES, svgEdges(), svgParticles());
  }

  function setProgress(idx) {
    const prog = $('rh-progress');
    if (!prog) return;
    prog.innerHTML = '';
    const total = STEPS.length;
    for (let i = 0; i < total; i++) {
      const seg = document.createElement('span');
      let cls = 'rh-seg';
      if (i < idx) cls += ' done';
      else if (i === idx) cls += (state.phase === 'wait' ? ' wait' : ' live');
      seg.className = cls;
      prog.appendChild(seg);
    }
  }

  function setRunhead(stage, statusKind, statusText) {
    $('rh-stage').textContent = stage;
    const tag = $('rh-status-tag');
    const txt = $('rh-status-text');
    tag.classList.remove('green', 'yellow', 'live');
    if (statusKind === 'wait') tag.classList.add('yellow');
    else if (statusKind === 'live') tag.classList.add('live');
    else if (statusKind === 'done') tag.classList.add('green');
    txt.textContent = statusText;
  }

  function setMeta(elapsedMs, cost) {
    $('rh-elapsed').textContent = (elapsedMs / 1000).toFixed(1) + 's';
    $('rh-cost').textContent = '€' + cost.toFixed(3);
  }

  function pushActivity(html, kind = 'done') {
    const list = $('act-list');
    const li = document.createElement('li');
    li.className = 'act-item ' + kind;
    const t = new Date();
    const tt = String(t.getHours()).padStart(2, '0') + ':' + String(t.getMinutes()).padStart(2, '0') + ':' + String(t.getSeconds()).padStart(2, '0');
    li.innerHTML = `<span class="act-time">${tt}</span><span class="act-mark"><span class="pip ${kind}"></span></span><span class="act-text">${html}</span>`;
    list.prepend(li);
    $('act-count').textContent = list.children.length + ' entries';
    // auto-open if collapsed
    const ac = $('activity-c');
    if (!ac.classList.contains('open')) ac.classList.add('open');
  }

  function showMcpToast(nodeId, tool) {
    const node = $(nodeId);
    if (!node) return;
    // halo on node
    const halo = node.querySelector('.mcp-halo');
    if (halo) {
      halo.classList.remove('fire');
      void halo.offsetWidth;
      halo.classList.add('fire');
    }
    // satellite toast
    const cluster = $('mcp-toast-cluster');
    const t = document.createElement('div');
    t.className = 'mcp-toast';
    t.innerHTML = `<span class="mt-tag">MCP</span><span class="mt-name">${tool}</span>`;
    const r = node.getBoundingClientRect();
    const pr = document.querySelector('.canvas-shell-c').getBoundingClientRect();
    t.style.left = (r.right - pr.left + 12) + 'px';
    t.style.top = (r.top - pr.top + 8) + 'px';
    cluster.appendChild(t);
    setTimeout(() => t.classList.add('show'), 20);
    setTimeout(() => { t.classList.remove('show'); t.classList.add('out'); }, 1400);
    setTimeout(() => t.remove(), 1800);
    pushActivity(`MCP <em>${tool}</em> · ${Math.round(120 + Math.random() * 320)}ms`, 'mcp');
  }

  function applyResult(result) {
    if (!result) return;
    Object.entries(result).forEach(([nodeId, fields]) => {
      Object.entries(fields).forEach(([k, v]) => {
        const el = document.querySelector(`#${nodeId} [data-field="${k}"]`);
        if (el) { el.textContent = v; el.classList.add('hl'); setTimeout(() => el.classList.remove('hl'), 600); }
      });
    });
  }

  function showHITLBanner(step) {
    const b = $('hitl-banner');
    if (!b) return;
    if (step.banner) {
      const nodeEl = $('hb-node'); if (nodeEl) nodeEl.textContent = step.banner.node;
      const titleEl = $('hb-title'); if (titleEl) titleEl.textContent = step.banner.node === 'Reserve gate' ? 'Operator approval needed' : 'Dossier handover review';
      const descEl = $('hb-desc'); if (descEl) descEl.innerHTML = step.banner.desc;
    }
    b.hidden = false;
    requestAnimationFrame(() => b.classList.add('show'));
  }

  function hideHITLBanner() {
    const b = $('hitl-banner');
    if (!b) return;
    b.classList.remove('show');
    setTimeout(() => b.hidden = true, 240);
  }

  // ─── main loop ─────────────────────────────────────────────────────
  function tickElapsed() {
    if (state.phase !== 'running') return;
    state.elapsedMs = Date.now() - state.startTs;
    setMeta(state.elapsedMs, state.cost);
  }

  function runStep(idx) {
    if (idx >= STEPS.length) { finish(); return; }
    state.cursor = idx;
    const step = STEPS[idx];

    // light up incoming edge
    if (idx > 0) setEdgeKind(STEPS[idx - 1].id, step.id, 'live');

    // node goes live
    setNodeState(step.id, step.hitl ? 'wait' : 'live', step.hitl ? 'waiting' : 'running');
    setProgress(idx);
    setRunhead(`${idx + 1} / ${STEPS.length} · ${step.name}`, step.hitl ? 'wait' : 'live', step.hitl ? `WAITING · OPERATOR · ${pad(state.elapsedMs)}` : `RUNNING · ${step.stage.toUpperCase()}`);

    // auto-pan to keep running card visible on the wide horizontal canvas
    if (window.CodexCanvas && window.CodexCanvas.centerOn) {
      window.CodexCanvas.centerOn(step.id);
    }

    // apply node result fields
    applyResult(step.result);

    // log activity
    if (step.activity && step.activity.length) step.activity.forEach(a => pushActivity(a, 'live'));

    if (step.hitl) {
      // pause and surface banner
      state.phase = 'wait';
      setEdgeKind(idx > 0 ? STEPS[idx - 1].id : '', step.id, 'wait');
      showHITLBanner(step);
      return;
    }

    // schedule MCP calls during the dur window
    (step.mcps || []).forEach((m, i) => {
      const offset = step.dur * (0.35 + i * 0.25);
      setTimeout(() => { if (state.phase === 'running') showMcpToast(step.id, m.tool); state.cost += 0.005 + Math.random() * 0.01; }, offset);
    });

    // when step finishes
    setTimeout(() => {
      if (state.phase !== 'running') return;
      setNodeState(step.id, 'done', 'done');
      if (idx > 0) setEdgeKind(STEPS[idx - 1].id, step.id, 'done');
      state.cost += 0.003 + Math.random() * 0.012;
      setMeta(state.elapsedMs, state.cost);
      runStep(idx + 1);
    }, step.dur);
  }

  function finish() {
    state.phase = 'done';
    setRunhead(`${STEPS.length} / ${STEPS.length} · complete`, 'done', `COMPLETE · ${pad(state.elapsedMs)}`);
    setProgress(STEPS.length);
    setMeta(state.elapsedMs, state.cost);
    pushActivity('<strong>Run complete</strong> <em>· dossier dispatched · vendor booked</em>', 'done');
    if (state.timer) { clearInterval(state.timer); state.timer = null; }
    $('rh-play').hidden = false; $('rh-pause').hidden = true;
  }

  function pad(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return String(m).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  }

  function start() {
    if (state.phase === 'wait') return; // user must approve to resume
    if (state.phase === 'done') reset();
    state.phase = 'running';
    state.startTs = Date.now() - state.elapsedMs;
    if (state.timer) clearInterval(state.timer);
    state.timer = setInterval(tickElapsed, 100);
    $('rh-play').hidden = true; $('rh-pause').hidden = false;
    runStep(state.cursor);
  }

  function pause() {
    state.phase = 'idle';
    setRunhead($('rh-stage').textContent, 'wait', `PAUSED · ${pad(state.elapsedMs)}`);
    if (state.timer) { clearInterval(state.timer); state.timer = null; }
    $('rh-play').hidden = false; $('rh-pause').hidden = true;
  }

  function reset() {
    state.phase = 'idle'; state.cursor = 0; state.elapsedMs = 0; state.cost = 0;
    if (state.timer) { clearInterval(state.timer); state.timer = null; }
    STEPS.forEach(s => setNodeState(s.id, 'queued', 'queued'));
    EDGES.forEach(e => e.kind = 'queued');
    drawEdges(EDGES, svgEdges(), svgParticles());
    setRunhead('— · idle', 'idle', 'IDLE · READY · 00:00');
    setMeta(0, 0);
    setProgress(-1);
    document.querySelectorAll('[data-field]').forEach(el => el.textContent = '—');
    $('act-list').innerHTML = '';
    $('act-count').textContent = '0 entries';
    hideHITLBanner();
    $('rh-play').hidden = false; $('rh-pause').hidden = true;
  }

  function approveHITL() {
    if (state.phase !== 'wait') return;
    const step = STEPS[state.cursor];
    const opt = document.querySelector('#hb-options .hb-opt.selected');
    const optLabel = opt ? opt.querySelector('strong').textContent : 'Approve';
    setNodeState(step.id, 'done', 'approved');
    if (state.cursor > 0) setEdgeKind(STEPS[state.cursor - 1].id, step.id, 'done');
    pushActivity(`<strong>${step.name}</strong> approved by <em>claire.b</em> · ${optLabel}`, 'done');
    hideHITLBanner();
    state.phase = 'running';
    state.startTs = Date.now() - state.elapsedMs;
    if (!state.timer) state.timer = setInterval(tickElapsed, 100);
    $('rh-play').hidden = true; $('rh-pause').hidden = false;
    runStep(state.cursor + 1);
  }

  function declineHITL() {
    if (state.phase !== 'wait') return;
    const step = STEPS[state.cursor];
    setNodeState(step.id, 'done', 'declined');
    pushActivity(`<strong>${step.name}</strong> declined by <em>claire.b</em> · run halted`, 'live');
    hideHITLBanner();
    state.phase = 'done';
    setRunhead(`halted at ${state.cursor + 1}/${STEPS.length}`, 'wait', `HALTED · ${pad(state.elapsedMs)}`);
    if (state.timer) { clearInterval(state.timer); state.timer = null; }
    $('rh-play').hidden = false; $('rh-pause').hidden = true;
  }

  // ─── inspector ─────────────────────────────────────────────────────
  function focusNode(id) {
    const step = STEPS.find(s => s.id === id);
    if (!step) return;
    document.querySelectorAll('.node-c.selected').forEach(n => n.classList.remove('selected'));
    $(id).classList.add('selected');
    $('ins-title').textContent = step.name;
    $('ins-sub').textContent = `step ${step.id === 'cn-harry' ? 8 : STEPS.indexOf(step) + 1} of 8 · ${step.stage}`;
    // populate spans tab with the step's MCPs
    const sp = $('ins-spans');
    if (sp) {
      sp.innerHTML = '';
      const li0 = document.createElement('li');
      li0.innerHTML = `<span class="sp-name">${step.id.replace('cn-','')}.run</span><span class="sp-d">${(step.dur/1000).toFixed(1)}s</span>`;
      sp.appendChild(li0);
      (step.mcps || []).forEach(m => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="sp-name">${m.tool}</span><span class="sp-d">${m.dur}ms</span>`;
        sp.appendChild(li);
      });
    }
    // ensure inspector open
    $('inspector-c').classList.add('open');
  }

  // ─── init wiring ───────────────────────────────────────────────────
  function init() {
    drawEdges(EDGES, svgEdges(), svgParticles());
    setProgress(-1);
    setMeta(0, 0);

    $('rh-play').addEventListener('click', start);
    $('rh-pause').addEventListener('click', pause);
    $('rh-replay').addEventListener('click', () => { reset(); setTimeout(start, 200); });
    $('rh-replay-top').addEventListener('click', () => { reset(); setTimeout(start, 200); });

    // HITL banner
    $('hb-approve').addEventListener('click', approveHITL);
    $('hb-decline').addEventListener('click', declineHITL);
    document.querySelectorAll('#hb-options .hb-opt').forEach(o => {
      o.addEventListener('click', () => {
        document.querySelectorAll('#hb-options .hb-opt').forEach(x => x.classList.remove('selected'));
        o.classList.add('selected');
        // update Approve label to match selection
        const amt = o.dataset.amount;
        const lab = amt && amt !== '0' ? `Approve · €${amt}` : 'Submit request';
        $('hb-approve').textContent = lab + ' →';
      });
    });

    // Inspector tabs
    document.querySelectorAll('#ins-tabs .ins-tab').forEach(t => {
      t.addEventListener('click', () => {
        document.querySelectorAll('#ins-tabs .ins-tab').forEach(b => b.classList.remove('active'));
        t.classList.add('active');
        const k = t.dataset.itab;
        document.querySelectorAll('.ins-pane').forEach(p => p.classList.toggle('active', p.dataset.ipane === k));
      });
    });
    $('ins-close').addEventListener('click', () => $('inspector-c').classList.toggle('open'));

    // Activity accordion
    $('act-toggle').addEventListener('click', () => $('activity-c').classList.toggle('open'));

    // Click any node to inspect
    document.querySelectorAll('.node-c').forEach(n => {
      n.addEventListener('click', (e) => {
        if (e.target.closest('.handle')) return;
        focusNode(n.id);
      });
    });

    window.addEventListener('resize', () => drawEdges(EDGES, svgEdges(), svgParticles()));
  }

  return {
    init,
    start, pause, reset,
    approveHITL, declineHITL,
    focusNode,
    redraw: () => drawEdges(EDGES, svgEdges(), svgParticles()),
    state,
  };
})();
window.CodexSim = CodexSim;
// ─── Builder simulation — 8-movement pilot composition, end-to-end faked ──
const CodexBuilder = (() => {
  const $ = id => document.getElementById(id);
  let mvIdx = 0;            // 0=idle, 1..8=movements
  let running = false;
  let timers = [];
  let waitingApprove = false;
  let tokens = 0, cost = 0;

  const TOKEN_TARGETS = [0, 5200, 14800, 23500, 31000, 41200, 48400, 58100, 64800];
  const COST_TARGETS  = [0, 0.26, 0.74, 1.17, 1.55, 2.06, 2.42, 2.90, 3.24];

  const MOVEMENTS = [
    null, // 1-indexed
    { // 1 PERSONAS & AS-IS JOURNEY
      eyebrow: 'MOUVEMENT I · L\'AS-IS',
      title: 'Vos personas, vos systèmes, <em>leur journée.</em>',
      lede: "Avant de penser agentique, mettons à plat ce qui se passe vraiment aujourd'hui — vos conseillers, leurs outils, leur temps, leurs frictions.",
      duration: 4800,
      chat: [
        { delay: 300, role: 'ai', by: 'Codex · 14:38', body: "Je dessine ce que je comprends de votre process. Vous corrigez, je suis. J'ai posé <strong>5 personas</strong> et <strong>12 nœuds de parcours</strong> depuis notre conversation. Ajustez librement.", citation: '↳ corpus_search · AXA FR motor playbook' },
        { delay: 2200, role: 'ai', by: 'Codex · 14:39', body: "Votre <em>AHT</em> actuel sur Genesys — avez-vous le chiffre ? Je vois la médiane FFA pour un plateau Lyon à <strong>12 min</strong>, mais votre configuration peut différer." },
        { delay: 4000, role: 'human', by: 'Sophie M. · 14:39', body: "AHT plateau : 11 min 40 en moyenne sur les 3 derniers mois. Le dépannage seul prend entre 3 et 5 min supplémentaires." },
      ],
      render: () => `
        <div class="mv-personas">
          <div class="personas-grid">
            <div class="persona-card">
              <div class="persona-icon">👩</div>
              <div class="persona-info">
                <div class="persona-name">Sophie M.</div>
                <div class="persona-role">Conseillère FNOL · Plateau Lyon</div>
                <div class="persona-kpi">≈ 140 appels/jour · NPS 38</div>
                <div class="persona-tools">Genesys · Salesforce SC · Guidewire</div>
              </div>
            </div>
            <div class="persona-card">
              <div class="persona-icon">👨</div>
              <div class="persona-info">
                <div class="persona-name">Marc T.</div>
                <div class="persona-role">Régulateur dépanneuse</div>
                <div class="persona-kpi">≈ 95 dispatches/jour</div>
                <div class="persona-tools">Portail vendor Allianz Trade-Towed</div>
              </div>
            </div>
            <div class="persona-card">
              <div class="persona-icon">🕵️</div>
              <div class="persona-info">
                <div class="persona-name">Hugo R.</div>
                <div class="persona-role">Inspecteur sinistres</div>
                <div class="persona-kpi">≈ 28 dossiers/jour</div>
                <div class="persona-tools">Guidewire ClaimCenter · email</div>
              </div>
            </div>
            <div class="persona-card">
              <div class="persona-icon">🧑</div>
              <div class="persona-info">
                <div class="persona-name">Le sinistré</div>
                <div class="persona-role">Client AXA · conducteur</div>
                <div class="persona-kpi">Attentes : clarté · rapidité · NPS</div>
                <div class="persona-tools">Téléphone · email · app AXA</div>
              </div>
            </div>
            <div class="persona-card">
              <div class="persona-icon">🔐</div>
              <div class="persona-info">
                <div class="persona-name">IT / Sécurité</div>
                <div class="persona-role">Gardien des intégrations</div>
                <div class="persona-kpi">Guidewire + Salesforce auth</div>
                <div class="persona-tools">Azure AD · API Gateway · SIEM</div>
              </div>
            </div>
            <div class="persona-add-cta">+ Ajouter un persona · <em>je remplis les champs</em></div>
          </div>
          <div class="journey-section">
            <div class="journey-eyebrow">Parcours as-is · 12 nœuds · 2 voies</div>
            <div class="journey-strip" id="journey-nodes"></div>
          </div>
        </div>`,
      onRender: () => {
        const nodes = [
          { actor: 'client', label: 'Appelle AXA · attente 4-7 min', tool: '☎️', pain: '11% abandon', kind: 'pain' },
          { actor: 'sophie', label: 'Identifie client · lookup Guidewire · 90 s', tool: 'GW', pain: 'jongle 4 systèmes', kind: 'pain' },
          { actor: 'sophie', label: 'Collecte faits accident · form Salesforce · 4-6 min', tool: 'SF', pain: 'client répète', kind: 'pain' },
          { actor: 'sophie', label: 'Questions fraude · heuristiques manuelles · 2 min', tool: '📋', pain: 'incohérent', kind: 'pain' },
          { actor: 'sophie', label: 'Dispatch dépannage · email/tél → Marc · 3-5 min', tool: '📧', pain: 'pas de statut live', kind: 'pain' },
          { actor: 'marc', label: 'Assigne vendor · portail · 5-12 min', tool: '🚛', pain: 'ETA imprécis', kind: 'pain' },
          { actor: 'client', label: 'Reçoit confirmation · email · variable', tool: '📩', pain: 'anxiété · pas de carte', kind: 'pain' },
          { actor: 'sophie', label: 'Crée dossier sinistre · Guidewire · 6-8 min', tool: 'GW', pain: 're-saisie données', kind: 'pain' },
          { actor: 'hugo', label: 'Reprend dossier le lendemain · GW + email · 35 min', tool: 'GW', pain: 'pièces manquantes', kind: 'pain' },
        ];
        const strip = document.getElementById('journey-nodes');
        if (!strip) return;
        nodes.forEach((n, i) => {
          const t = setTimeout(() => {
            const div = document.createElement('div');
            div.className = `journey-node journey-actor-${n.actor}`;
            div.style.cssText = 'opacity:0;transform:translateX(-6px);transition:opacity 280ms ease,transform 280ms ease';
            div.innerHTML = `<span class="jn-tool">${n.tool}</span><div class="jn-body"><span class="jn-label">${n.label}</span><span class="jn-pain" title="${n.pain}">⚠ ${n.pain}</span></div>`;
            strip.appendChild(div);
            requestAnimationFrame(() => { div.style.opacity = '1'; div.style.transform = 'translateX(0)'; });
          }, 400 + i * 300);
          timers.push(t);
        });
      },
    },
    { // 2 RESEARCH
      eyebrow: 'MOUVEMENT II · RECHERCHE',
      title: 'Le terrain, <em>avant les promesses.</em>',
      lede: "J'ai cherché ce que disent les régulateurs, votre marché, et vos cohortes historiques. Voici ce qui contraint, et trois défis que je vois venir.",
      duration: 5200,
      chat: [
        { delay: 200, role: 'ai', by: 'Codex · 14:40', body: "Recherche en cours — <em>web_search_insurance</em>, <em>regulator_lookup</em>, <em>corpus_search</em>. 12 à 18 sources attendues.", citation: '↳ ACPR · RGPD Art.22 · EU AI Act Art.50 · FFA 2024' },
        { delay: 4200, role: 'ai', by: 'Codex · 14:41', body: "<strong>3 défis que je vois venir.</strong> Deux contraintes réglementaires bloquantes, et un écart volume à vérifier avant de fonder le cas d'affaires." },
      ],
      render: () => `
        <div class="mv-research">
          <div class="research-cols">
            <div class="research-citations">
              <div class="research-eyebrow">Citations · 12 sources</div>
              <ul id="cit-list" class="cit-stream"></ul>
            </div>
            <div class="research-challenges">
              <div class="research-eyebrow">Défis identifiés</div>
              <div id="challenge-list"></div>
            </div>
          </div>
        </div>`,
      onRender: () => {
        const citations = [
          { tag: 'contraignant', kind: 'yellow', title: 'RGPD Art. 22 — Décision automatisée', sub: 'droit à la revue humaine · tout refus auto exige doc humaine' },
          { tag: 'contraignant', kind: 'yellow', title: 'EU AI Act Art. 50 — Disclosure IA', sub: 'mention obligatoire «agent automatisé» en début d’appel' },
          { tag: 'contraignant', kind: 'yellow', title: 'Code assurances Art. L121-12', sub: 'subrogation · délais contestation sinistre moteur' },
          { tag: 'contexte', kind: 'blue', title: 'FFA — Rapport annuel 2024', sub: 'FNOL moteur · médiane Lyon 38 conseillers → 9 200/mois' },
          { tag: 'contexte', kind: 'blue', title: 'ACPR — L113-2 obligations info', sub: 'information assurée avant décision d’indemnisation' },
          { tag: 'contexte', kind: 'blue', title: 'CNIL — Guidance IA décision 2024-03', sub: 'revue humaine documentée exigée · impact significatif' },
          { tag: 'contexte', kind: 'blue', title: 'ElevenLabs — EU AI Act compliance', sub: 'disclosure script · délai d’énoncé < 3 secondes appel' },
          { tag: 'contexte', kind: 'blue', title: 'FFA — Taux fraude moteur 2024', sub: '3,2 % fraude déclarée · 8-12 % suspicion plateau' },
          { tag: 'contexte', kind: 'blue', title: 'Genesys — SLA rétention appel', sub: 'AHT médiane 11m40 · abandon > 4 min = -18 pts NPS' },
          { tag: 'contexte', kind: 'blue', title: 'AXA — Playbook Motor FR 2024', sub: 'flux tow dispatch · SLA 90 s acknowledgement client' },
          { tag: 'contexte', kind: 'blue', title: 'Guidewire — ClaimCenter API v10', sub: 'création sinistre · lookup police · booleans fraude' },
          { tag: 'contexte', kind: 'blue', title: 'ARCOM — Février 2025 IA vocale', sub: 'agent vocal IA = système IA à haut risque art. 6 AI Act' },
        ];
        const challenges = [
          { icon: '⚖️', title: 'RGPD Art. 22 — décision auto à impact significatif', body: "Tout refus auto > €X exige une revue humaine documentée. Pénalité CNIL jusqu’à 4 % CA mondial.", source: 'RGPD Art. 22(3) · CNIL guidance 2024-03' },
          { icon: '🎙️', title: 'Disclosure ElevenLabs en début d’appel', body: "L'EU AI Act exige mention explicite «vous parlez à un agent automatisé» dans les 3 premières secondes. Amende administrative sinon.", source: 'AI Act Art. 50 · ARCOM fév. 2025' },
          { icon: '📊', title: 'Distorsion volume Genesys', body: "Vous m'avez donné 12 000 FNOL/mois — la médiane FFA pour un plateau Lyon 38 conseillers est ~ 9 200. À vérifier avant de fonder le cas d'affaires.", source: 'FFA rapport 2024 p. 47' },
        ];
        const list = document.getElementById('cit-list');
        if (list) {
          citations.forEach((it, i) => {
            const t = setTimeout(() => {
              const li = document.createElement('li');
              li.className = 'cit-row';
              li.style.cssText = 'opacity:0;transform:translateY(6px);transition:opacity 300ms ease,transform 300ms ease';
              li.innerHTML = `<span class="tag ${it.kind}"><span class="pip"></span>${it.tag}</span><div><div class="cit-title">${it.title}</div><div class="cit-sub">${it.sub}</div></div>`;
              list.appendChild(li);
              requestAnimationFrame(() => { li.style.opacity = '1'; li.style.transform = 'translateY(0)'; });
            }, 200 + i * 260);
            timers.push(t);
          });
        }
        const clist = document.getElementById('challenge-list');
        if (clist) {
          challenges.forEach((c, i) => {
            const t = setTimeout(() => {
              const div = document.createElement('div');
              div.className = 'challenge-card';
              div.style.cssText = 'opacity:0;transform:translateX(8px);transition:opacity 380ms ease,transform 380ms ease';
              div.innerHTML = `<div class="challenge-icon">${c.icon}</div><div class="challenge-body"><div class="challenge-title">${c.title}</div><div class="challenge-text">${c.body}</div><div class="challenge-source">↳ ${c.source}</div></div>`;
              clist.appendChild(div);
              requestAnimationFrame(() => { div.style.opacity = '1'; div.style.transform = 'translateX(0)'; });
            }, 1800 + i * 600);
            timers.push(t);
          });
        }
      },
    },
    { // 3 PLAN
      eyebrow: 'MOUVEMENT III · PLAN',
      title: 'Un flux <em>conçu, pas hérité.</em>',
      lede: "14 nœuds, 4 portes humaines. Chaque porte porte le coût d'erreur que vous m'avez confirmé, sa source, et la phrase d'impact si vous la sautez.",
      duration: 4200,
      chat: [
        { delay: 200, role: 'ai', by: 'Codex · 14:42', body: "J'ai esquissé le flux to-be à partir de votre parcours, des citations et des contraintes que vous avez confirmées. 4 portes HITL, 4 étapes IA. Dites-moi laquelle remettre en question.", citation: '↳ RGPD Art.22 · clamp porte C obligatoire' },
        { delay: 3200, role: 'ai', by: 'Codex · 14:43', body: "Je ne peux pas écarter en silence une porte contraignante. Soit on la garde, soit on change le règlement." },
      ],
      render: () => `
        <div class="mv-plan">
          <div class="flow-eyebrow">TO-BE · 14 nœuds · 4 portes HITL</div>
          <div id="flow-nodes-plan" class="flow-nodes-list"></div>
        </div>`,
      onRender: () => {
        const nodes = [
          { ix: 'i.', name: 'Agent vocal ElevenLabs répond', sub: 'outil · disclosure EU AI Act Art.50 · 0 attente', tag: 'outil', kind: 'blue', icon: '🔌' },
          { ix: 'ii.', name: 'Classification intention IA', sub: 'ia · intent classifier · Guidewire lookup', tag: 'IA', kind: 'azur', icon: '✨' },
          { ix: 'iii.', name: 'Lookup police Guidewire', sub: 'outil · ClaimCenter API v10 · policy lookup', tag: 'outil', kind: 'blue', icon: '🔌' },
          { ix: 'iv.', name: 'Score fraude IA (rubrique)', sub: 'ia créative · seuil 0,65 · rubrique Langfuse', tag: 'IA · créatif', kind: 'azur', icon: '🪄' },
          { ix: 'v.', name: '⚠ Porte A — fraude > 0,65 → Sophie', sub: 'HITL · €4 800/err · SLA 90 s · citation RGPD', tag: 'PORTE HITL', kind: 'amber', gate: true, cost: '€4 800/err' },
          { ix: 'vi.', name: 'Évaluation sévérité IA', sub: 'ia · photo damage + NLP → sévérité', tag: 'IA', kind: 'azur', icon: '✨' },
          { ix: 'vii.', name: 'SMS Twilio + carte OSM live', sub: 'outil · Twilio · confirmation ETA + lien carte', tag: 'outil', kind: 'blue', icon: '🔌' },
          { ix: 'viii.', name: 'Dispatch dépannage n8n', sub: 'outil · n8n choré → provider réel', tag: 'outil', kind: 'blue', icon: '🔌' },
          { ix: 'ix.', name: '⚠ Porte B — sévérité haute → Hugo < 5 min', sub: 'HITL · €25 000/err · SLA 5 min · citation FFA', tag: 'PORTE HITL', kind: 'amber', gate: true, cost: '€25 000/err' },
          { ix: 'x.', name: 'Lettre client auto-rédigée IA', sub: 'ia créative · tone analysis → rédaction personnalisée', tag: 'IA · créatif', kind: 'azur', icon: '🪄' },
          { ix: 'xi.', name: '⚠ Porte C — sinistre > €4 000 → manager (RGPD Art.22)', sub: 'HITL · réglementaire obligatoire · citation RGPD Art.22(3)', tag: 'PORTE HITL', kind: 'amber', gate: true, cost: 'réglementaire' },
          { ix: 'xii.', name: 'Compilation dossier IA', sub: 'ia · all facts + evidence → dossier structuré', tag: 'IA', kind: 'azur', icon: '✨' },
          { ix: 'xiii.', name: '⚠ Porte D — revue adjuster avant règlement', sub: 'HITL · €8 200/err · SLA 4 h · pièces manquantes', tag: 'PORTE HITL', kind: 'amber', gate: true, cost: '€8 200/err' },
          { ix: 'xiv.', name: 'Mise à jour Salesforce + Guidewire', sub: 'outil · settlement update · audit ancré', tag: 'outil', kind: 'blue', icon: '🔌' },
        ];
        const list = document.getElementById('flow-nodes-plan');
        if (!list) return;
        nodes.forEach((n, i) => {
          const t = setTimeout(() => {
            const div = document.createElement('div');
            div.className = `flow-node-row${n.gate ? ' gate-node' : ''}`;
            div.style.cssText = 'opacity:0;transform:translateY(5px);transition:opacity 280ms ease,transform 280ms ease';
            const costChip = n.cost ? `<span class="cost-chip">${n.cost}</span>` : '';
            const icon = n.icon || '';
            div.innerHTML = `<span class="fn-ix">${n.ix}</span><span class="fn-icon">${icon}</span><div class="fn-body"><span class="fn-name">${n.name}</span><span class="fn-sub">${n.sub}</span></div>${costChip}<span class="tag ${n.kind} fn-tag"><span class="pip"></span>${n.tag}</span>`;
            list.appendChild(div);
            requestAnimationFrame(() => { div.style.opacity = '1'; div.style.transform = 'translateY(0)'; });
          }, 180 + i * 220);
          timers.push(t);
        });
      },
    },
    { // 4 BUSINESS CASE — "B with the twist"
      eyebrow: 'MOUVEMENT IV · CAS D\'AFFAIRES',
      title: 'Le coût de l\'inaction, <em>chiffré.</em>',
      lede: "À partir des coûts aux 4 portes HITL et du volume que vous m'avez donné, voici la fourchette d'économies sur 12 mois — à raffiner pendant le pilote, pas avant.",
      duration: 0,
      chat: [
        { delay: 300, role: 'ai', by: 'Codex · 14:44', body: "J'ai calculé la fourchette depuis vos 4 portes HITL et le volume Genesys. Faites glisser les curseurs — la fourchette se met à jour en 80 ms.", citation: '↳ FFA 2024 · ACPR · cohorte AXA sinistres 2023' },
        { delay: 2800, role: 'ai', by: 'Codex · 14:44', body: "Ce chiffre n'inclut pas le gain opérationnel sur l'équipe de Sophie — environ <strong>5,4 h/jour</strong> libérées. Je peux rédiger un mémo séparé pour la planification RH." },
      ],
      render: () => `
        <div class="mv-bizcase">
          <div class="biz-sliders">
            <div class="slider-row">
              <label>Volume mensuel <span class="slider-val" id="sl-vol-v">9 200</span> FNOL</label>
              <input type="range" id="sl-vol" min="4000" max="18000" value="9200" step="200">
            </div>
            <div class="slider-row">
              <label>Précision visée <span class="slider-val" id="sl-acc-v">87</span>%</label>
              <input type="range" id="sl-acc" min="70" max="99" value="87" step="1">
            </div>
            <div class="slider-row">
              <label>Taux de repli humain <span class="slider-val" id="sl-fb-v">18</span>%</label>
              <input type="range" id="sl-fb" min="5" max="50" value="18" step="1">
            </div>
          </div>

          <div class="biz-headline">
            <div class="cost-card" id="cost-card">
              <div class="cost-primary">
                <span class="cost-icon">🪙</span>
                <span class="cost-number" id="cost-num">€350 000</span>
                <span class="cost-band">/ an · fourchette <span id="cost-range">€280k – €420k</span></span>
              </div>
              <div class="cost-confidence">estimation · à raffiner au pilote</div>
              <div class="cost-axes-hover" id="cost-axes">
                <div class="axis-card">
                  <div class="axis-icon">💶</div>
                  <div class="axis-label">Coût d'erreur évité</div>
                  <div class="axis-value" id="ax-err">€218 400 / an</div>
                  <div class="axis-sub">4 portes × erreurs/mois × coût moyen</div>
                </div>
                <div class="axis-card">
                  <div class="axis-icon">⏱️</div>
                  <div class="axis-label">Économie FTE·h</div>
                  <div class="axis-value" id="ax-fte">€84 600 / an</div>
                  <div class="axis-sub">~5,4 h/j libérées · Sophie + équipe</div>
                </div>
                <div class="axis-card">
                  <div class="axis-icon">⚖️</div>
                  <div class="axis-label">Réduction risque réglementaire</div>
                  <div class="axis-value" id="ax-reg">€47 000 / an</div>
                  <div class="axis-sub">CNIL/ACPR · exposition amende évitée</div>
                </div>
              </div>
            </div>
          </div>

          <div class="biz-sensitivity">
            <div class="sens-eyebrow">Tableau de sensibilité</div>
            <table class="sens-table" id="sens-table">
              <thead><tr><th></th><th>Pessimiste</th><th>Réaliste</th><th>Optimiste</th></tr></thead>
              <tbody>
                <tr><td>Volume seul</td><td id="s-vp">€189k</td><td id="s-vr">€280k</td><td id="s-vo">€412k</td></tr>
                <tr><td>Précision seule</td><td id="s-ap">€224k</td><td id="s-ar">€350k</td><td id="s-ao">€476k</td></tr>
                <tr><td>Repli humain seul</td><td id="s-fp">€198k</td><td id="s-fr">€315k</td><td id="s-fo">€441k</td></tr>
              </tbody>
            </table>
          </div>
          <div class="biz-deck-cta">
            <button class="btn" id="b-deck">Préparer une slide pour le comité → 7 slides, template AXA Canopée</button>
          </div>
        </div>`,
      onRender: () => {
        function calcROI(vol, acc, fb) {
          const errorCost = vol * 0.038 * (1 - acc / 100) * 9.2 * 12;
          const fteSaving = vol * 0.0062 * 35 * 12;
          const regRisk = 47000 + vol * 0.002 * 8;
          const total = errorCost * 0.72 + fteSaving * 0.68 + regRisk;
          return { total: Math.round(total / 1000) * 1000, errorCost: Math.round(errorCost * 0.72), fteSaving: Math.round(fteSaving * 0.68), regRisk: Math.round(regRisk) };
        }
        function fmt(n) { return '€' + (n >= 1000 ? (n/1000).toFixed(0) + 'k' : n.toLocaleString('fr-FR')); }
        function fmtFull(n) { return '€' + n.toLocaleString('fr-FR'); }
        function update() {
          const vol = +document.getElementById('sl-vol').value;
          const acc = +document.getElementById('sl-acc').value;
          const fb  = +document.getElementById('sl-fb').value;
          document.getElementById('sl-vol-v').textContent = vol.toLocaleString('fr-FR');
          document.getElementById('sl-acc-v').textContent = acc;
          document.getElementById('sl-fb-v').textContent = fb;
          const r = calcROI(vol, acc, fb);
          const low = Math.round(r.total * 0.80 / 1000) * 1000;
          const high = Math.round(r.total * 1.20 / 1000) * 1000;
          document.getElementById('cost-num').textContent = fmtFull(r.total);
          document.getElementById('cost-range').textContent = `${fmt(low)} – ${fmt(high)}`;
          document.getElementById('ax-err').textContent = fmtFull(r.errorCost) + ' / an';
          document.getElementById('ax-fte').textContent = fmtFull(r.fteSaving) + ' / an';
          document.getElementById('ax-reg').textContent = fmtFull(r.regRisk) + ' / an';
          // sensitivity cells
          const rp = calcROI(vol * 0.7, acc, fb); const ro = calcROI(vol * 1.3, acc, fb);
          document.getElementById('s-vp').textContent = fmt(Math.round(rp.total/1000)*1000);
          document.getElementById('s-vr').textContent = fmt(r.total);
          document.getElementById('s-vo').textContent = fmt(Math.round(ro.total/1000)*1000);
          const ap = calcROI(vol, acc - 12, fb); const ao = calcROI(vol, Math.min(98, acc + 8), fb);
          document.getElementById('s-ap').textContent = fmt(Math.round(ap.total/1000)*1000);
          document.getElementById('s-ar').textContent = fmt(r.total);
          document.getElementById('s-ao').textContent = fmt(Math.round(ao.total/1000)*1000);
          const fp = calcROI(vol, acc, fb + 15); const fo = calcROI(vol, acc, Math.max(5, fb - 10));
          document.getElementById('s-fp').textContent = fmt(Math.round(fp.total/1000)*1000);
          document.getElementById('s-fr').textContent = fmt(r.total);
          document.getElementById('s-fo').textContent = fmt(Math.round(fo.total/1000)*1000);
        }
        ['sl-vol', 'sl-acc', 'sl-fb'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.addEventListener('input', update);
        });
        const deck = document.getElementById('b-deck');
        if (deck) deck.addEventListener('click', () => {
          deck.textContent = '✓ Génération slide en cours… (simulation)';
          deck.disabled = true;
        });
        const t = setTimeout(update, 100);
        timers.push(t);
      },
    },
    { // 5 SYNTHETIC SEED
      eyebrow: 'MOUVEMENT V · SEED SYNTHÉTIQUE',
      title: 'Les données, <em>nées sous vos yeux.</em>',
      lede: "Regardez-moi générer 240 scénarios FNOL moteur sur le périmètre que vous m'avez donné. Pause quand vous voulez, modifiez la forme, demandez un cas-limite.",
      duration: 6000,
      chat: [
        { delay: 400, role: 'ai', by: 'Codex · 14:45', body: "Génération de 10 tamponnements-arrière simples — ils représentent 42 % du périmètre. Vous en voulez moins ?" },
        { delay: 2600, role: 'ai', by: 'Codex · 14:46', body: "Ajout d'un cas-extrême : client qui raccroche en cours d’appel. L'agent doit-il tenter un rappel ?" },
        { delay: 5000, role: 'human', by: 'Sophie M. · 14:46', body: "Oui, un rappel automatique après 90 secondes, max 2 tentatives. Loguer si pas de réponse." },
      ],
      render: () => `
        <div class="mv-synth">
          <div class="synth-left">
            <div class="synth-eyebrow"><span class="pip azur"></span> Génération en cours · <span id="synth-count">0</span> / 240 scénarios</div>
            <div class="synth-feed" id="synth-feed"></div>
            <div class="synth-validators" id="synth-validators"></div>
          </div>
          <div class="synth-right">
            <div class="synth-settings-title">Paramètres</div>
            <div class="synth-setting-row">
              <label>Nombre <strong>240</strong></label>
            </div>
            <div class="synth-setting-row">
              <label>Mix langues <strong>FR 80% · EN 20%</strong></label>
            </div>
            <div class="synth-setting-row">
              <label>Taux de fraude <strong>8 %</strong></label>
            </div>
            <div class="synth-advanced">
              <div class="synth-adv-title">Avancé</div>
              <div class="synth-checkbox"><input type="checkbox" checked> Tamponnement arrière simple</div>
              <div class="synth-checkbox"><input type="checkbox" checked> Multi-véhicules sévérité ambiguë</div>
              <div class="synth-checkbox"><input type="checkbox" checked> Raccroche en cours d’appel</div>
              <div class="synth-checkbox"><input type="checkbox"> Délit de fuite</div>
              <div class="synth-checkbox"><input type="checkbox"> Plaque étrangère</div>
              <div class="synth-checkbox"><input type="checkbox"> Conducteur alcoolisé</div>
            </div>
            <button class="btn btn-primary" id="b-approve-seed" style="margin-top:16px;width:100%" disabled>Valider le seed → débloquer Mouvement VI</button>
          </div>
        </div>`,
      onRender: () => {
        const records = [
          { kind: '🚗', label: 'client_record · CL-SYN-001 · Sophie Renard · Lyon 69003' },
          { kind: '📋', label: 'policy_record · POL-2024-8821 · moteur · franchise 500€' },
          { kind: '💥', label: 'accident_scenario · tamponnement arrière · A6 sortie 33 · 14:22' },
          { kind: '🎙️', label: 'voice_recording · ElevenLabs TTS · FR · 2m34s · sans PII' },
          { kind: '📸', label: 'damage_photo · gen · pare-chocs arr. · severite=2/5' },
          { kind: '🚛', label: 'tow_vendor · Dépann\'Express Lyon · ETA 22 min' },
          { kind: '📋', label: 'policy_record · POL-2024-5543 · flotte 12v · franchise 1 000€' },
          { kind: '💥', label: 'accident_scenario · multi-véhicules · M7 · ambiguïté sévérité' },
          { kind: '🚗', label: 'client_record · CL-SYN-009 · Marco Bellini · acte-fraude suspicion' },
          { kind: '💥', label: 'accident_scenario [EDGE] · raccroche mi-appel · rappel ×2 logged' },
          { kind: '🎙️', label: 'voice_recording · ElevenLabs TTS · EN · 1m12s · sans PII' },
          { kind: '📸', label: 'damage_photo · gen · airbag déclenché · severite=4/5' },
        ];
        const feed = document.getElementById('synth-feed');
        const countEl = document.getElementById('synth-count');
        let count = 0;
        if (!feed) return;
        records.forEach((r, i) => {
          const t = setTimeout(() => {
            count += Math.floor(Math.random() * 12) + 8;
            if (countEl) countEl.textContent = Math.min(240, count);
            const div = document.createElement('div');
            div.className = 'synth-record';
            div.style.cssText = 'opacity:0;transform:translateY(4px);transition:opacity 220ms ease,transform 220ms ease';
            div.innerHTML = `<span class="synth-kind">${r.kind}</span><span class="synth-label">${r.label}</span>`;
            feed.appendChild(div);
            feed.scrollTop = feed.scrollHeight;
            requestAnimationFrame(() => { div.style.opacity = '1'; div.style.transform = 'translateY(0)'; });
          }, 300 + i * 420);
          timers.push(t);
        });
        const t2 = setTimeout(() => {
          if (countEl) countEl.textContent = '240';
          const validators = document.getElementById('synth-validators');
          if (validators) {
            validators.innerHTML = `<div class="validator-row ok">schéma ✓</div><div class="validator-row ok">distribution ✓</div><div class="validator-row ok">anti-PII ✓</div><div class="validator-row ok">fidélité persona ✓</div>`;
          }
          const btn = document.getElementById('b-approve-seed');
          if (btn) btn.disabled = false;
        }, 300 + 12 * 420 + 800);
        timers.push(t2);
        const btn = document.getElementById('b-approve-seed');
        if (btn) btn.addEventListener('click', () => {
          btn.textContent = '✓ Seed validé · Mouvement VI débloqué';
          btn.disabled = true;
          appendChat({ role: 'human', by: 'Sophie M. · 14:47', body: 'Seed validé. Continuons.' });
        });
      },
    },
    { // 6 CHARTER
      eyebrow: 'MOUVEMENT VI · CHARTE',
      title: 'Les règles du jeu, <em>convenues par écrit.</em>',
      lede: "Règles dures à ne jamais enfreindre. Contrats d'intégration réels (vrais endpoints dès L1). Accords pris en chemin. Signez une fois, c'est verrouillé.",
      duration: 3600,
      chat: [
        { delay: 300, role: 'ai', by: 'Codex · 14:47', body: "Compilation de la charte — 7 règles dures, 5 intégrations réelles, 4 accords de session. J'ai détecté une <strong>tension</strong> à résoudre.", citation: '↳ RGPD Art.22 · lint_capability_manifest ✓' },
        { delay: 2800, role: 'human', by: 'Sophie M. · 14:48', body: "La porte C reste. Aucun paiement auto > €4 000 sans revue humaine." },
      ],
      render: () => `
        <div class="mv-charter">
          <div class="tension-banner" id="tension-banner">
            <span class="tension-icon">⚔️</span>
            <div class="tension-body">
              <div class="tension-title">Tension détectée</div>
              <div class="tension-text">Vous avez dit «jamais de paiement auto > €4 000» au Mouvement I, mais le plan III autorise jusqu’à €4 200. Lequel l'emporte ?</div>
            </div>
            <div class="tension-actions">
              <button class="btn" id="t-keep">Garder la porte C (€4 000)</button>
              <button class="btn btn-ghost" id="t-raise">Monter à €4 200</button>
            </div>
          </div>

          <div class="charter-panels">
            <div class="charter-panel" id="panel-rules">
              <div class="charter-panel-head"><span class="cp-icon">⚖️</span><span>7 règles dures</span><span class="cp-chevron">▼</span></div>
              <div class="charter-panel-body" id="rules-body"></div>
            </div>
            <div class="charter-panel" id="panel-integrations">
              <div class="charter-panel-head"><span class="cp-icon">🔌</span><span>5 intégrations</span><span class="cp-chevron">▼</span></div>
              <div class="charter-panel-body" id="integrations-body"></div>
            </div>
            <div class="charter-panel" id="panel-agreements">
              <div class="charter-panel-head"><span class="cp-icon">✅</span><span>4 accords</span><span class="cp-chevron">▼</span></div>
              <div class="charter-panel-body" id="agreements-body"></div>
            </div>
          </div>

          <div class="charter-sign-row">
            <button class="btn" id="b-compliance-memo">Générer un mémo conformité pour le juridique → PDF</button>
            <button class="btn btn-primary" id="b-sign-charter" disabled>Signer la charte &amp; continuer → Mouvement VII</button>
          </div>
        </div>`,
      onRender: () => {
        const rules = [
          'Aucun paiement automatique > €4 000 sans revue humaine documentée · RGPD Art.22(3)',
          'Disclosure «agent automatisé» dans les 3 premières secondes de tout appel · EU AI Act Art.50',
          'Toute décision de fraude automatique doit générer un log immuable · ACPR L113-2',
          'PII redaction par défaut sur toutes les traces Langfuse · CNIL guidance 2024-03',
          'Seuil de confiance minimum 0,65 pour le score fraude — non abaissable sans revue juridique',
          'SLA 90 s pour toute passation HITL — dépassement = retour file manuelle',
          'Secret rotation mensuelle — aucun credential hardcodé dans les flows',
        ];
        const integrations = [
          { name: 'ElevenLabs Voice', endpoint: 'api.elevenlabs.io · EU region', auth: 'API key · env var', sandbox: 'sandbox.elevenlabs.io', owner: 'IT/Voix' },
          { name: 'Guidewire ClaimCenter', endpoint: 'gc.axa-fr.internal · private', auth: 'OAuth2 PKCE · Azure AD', sandbox: 'gc-sandbox.axa-fr.internal', owner: 'IT/Guidewire' },
          { name: 'Salesforce Service Cloud', endpoint: 'axafr.my.salesforce.com', auth: 'Connected App OAuth2', sandbox: 'axafr--uat.sandbox.my', owner: 'CRM Team' },
          { name: 'Twilio SMS', endpoint: 'api.twilio.com · EU data residency', auth: 'Account SID + Auth Token · env var', sandbox: 'test credentials', owner: 'IT/Communications' },
          { name: 'n8n MCP Tools', endpoint: 'n8n.gdai.railway.internal', auth: 'internal · service token', sandbox: 'n8n-staging.gdai.railway', owner: 'AI Platform' },
        ];
        const agreements = [
          { text: 'NPS mesuré sur chaque appel — baseline avant L1 obligatoire', time: '14:42' },
          { text: 'Sophie conserve le droit de refus sur tout HITL — sans justification exigée', time: '14:44' },
          { text: 'Rappel automatique 90 s max × 2 tentatives si raccroche mi-appel', time: '14:46' },
          { text: 'Porte C fixée à €4 000 — non négociable au Mouvement VII', time: '14:48' },
        ];
        const rb = document.getElementById('rules-body');
        if (rb) rb.innerHTML = rules.map(r => `<div class="rule-item">⚖️ ${r}</div>`).join('');
        const ib = document.getElementById('integrations-body');
        if (ib) ib.innerHTML = integrations.map(i => `<div class="integration-item"><strong>${i.name}</strong><span class="int-ep">${i.endpoint}</span><span class="int-auth">${i.auth}</span><span class="int-owner">Owner: ${i.owner}</span></div>`).join('');
        const ab = document.getElementById('agreements-body');
        if (ab) ab.innerHTML = agreements.map(a => `<div class="agreement-item">✅ ${a.text} <span class="agr-time">· ${a.time}</span></div>`).join('');

        // Tension resolution
        let tensionResolved = false;
        const signBtn = document.getElementById('b-sign-charter');
        function resolveTension(choice) {
          if (tensionResolved) return;
          tensionResolved = true;
          const banner = document.getElementById('tension-banner');
          if (banner) { banner.style.opacity = '0'; setTimeout(() => banner.remove(), 300); }
          appendChat({ role: 'human', by: 'Sophie M. · 14:48', body: choice === 'keep' ? 'La porte C reste. Aucun paiement auto > €4 000 sans revue humaine.' : 'On monte à €4 200 — je prends la responsabilité.' });
          if (signBtn) signBtn.disabled = false;
        }
        const tk = document.getElementById('t-keep');
        const tr = document.getElementById('t-raise');
        if (tk) tk.addEventListener('click', () => resolveTension('keep'));
        if (tr) tr.addEventListener('click', () => resolveTension('raise'));

        // Panel toggles
        document.querySelectorAll('.charter-panel-head').forEach(head => {
          head.addEventListener('click', () => {
            const panel = head.parentElement;
            panel.classList.toggle('open');
          });
        });
        const t1 = setTimeout(() => { document.querySelector('#panel-rules')?.classList.add('open'); }, 200);
        const t2 = setTimeout(() => { document.querySelector('#panel-integrations')?.classList.add('open'); }, 600);
        const t3 = setTimeout(() => { document.querySelector('#panel-agreements')?.classList.add('open'); }, 1000);
        timers.push(t1, t2, t3);

        // Sign charter
        if (signBtn) signBtn.addEventListener('click', () => {
          signBtn.textContent = '✓ Charte signée · Mouvement VII débloqué';
          signBtn.disabled = true;
          setRunhead('CHARTE SIGNÉE · MOUVEMENT 6/8', 'azur');
        });
        const memo = document.getElementById('b-compliance-memo');
        if (memo) memo.addEventListener('click', () => {
          memo.textContent = '✓ Mémo conformité généré (simulation)';
          memo.disabled = true;
        });
      },
    },
    { // 7 REHEARSAL
      eyebrow: 'MOUVEMENT VII · RÉPÉTITION',
      title: 'L\'écran de votre conseillère, <em>avant le premier appel.</em>',
      lede: "Cliquez sur une porte humaine pour parcourir ce que Sophie ou Hugo verront vraiment. KPI séparés : baseline d’aujourd’hui à gauche, ce qu'on mesure pendant le run à droite.",
      duration: 4800,
      chat: [
        { delay: 300, role: 'ai', by: 'Codex · 14:49', body: "AHT baseline : 12 min. Je propose 90 s pour les cas IA-traités, 4 min pour les HITL escaladés. Cliquez porte A ou B pour voir l'interface Sophie.", citation: '↳ Genesys AHT · FFA p.47 · Chatwoot HITL UI' },
        { delay: 3600, role: 'ai', by: 'Codex · 14:50', body: "Si Sophie décline : le sinistre revient en file manuelle, l'IA journalise l'écart de raisonnement, le dataset de réentraînement gagne une ligne." },
      ],
      render: () => `
        <div class="mv-rehearsal">
          <div class="rehearsal-flow" id="rehearsal-flow"></div>
          <div class="hitl-sim" id="hitl-sim" style="display:none">
            <div class="hitl-sim-head">
              <span class="hitl-sim-title">Simulation HITL · Voici exactement ce que Sophie verra dès le L1</span>
              <button class="btn btn-ghost" id="hitl-sim-close">✕ Fermer</button>
            </div>
            <div class="hitl-sim-body">
              <div class="hitl-dossier">
                <div class="hitl-claim-id">CLM-SYN-005 · Score fraude : <strong>0.71</strong> · Seuil : 0.65</div>
                <div class="hitl-fields">
                  <div class="hitl-field"><span>Client</span><strong>Marco Bellini · Lyon 69007</strong></div>
                  <div class="hitl-field"><span>Police</span><strong>POL-2024-9943 · moteur flotte</strong></div>
                  <div class="hitl-field"><span>Accident</span><strong>A6 sortie 33 · tamponnement arr.</strong></div>
                  <div class="hitl-field"><span>Montant estimé</span><strong>€2 840 · 2 photos reçues</strong></div>
                  <div class="hitl-field"><span>IA rationale</span><strong>Incohérence MMS timestamp vs déclaration horaire</strong></div>
                </div>
              </div>
              <div class="hitl-actions-row">
                <button class="btn btn-primary" id="hitl-approve">✓ Approuver · continuer auto</button>
                <button class="btn" id="hitl-escalate">↑ Escalader à Hugo</button>
                <button class="btn btn-ghost" id="hitl-decline">✕ Rejeter · file manuelle</button>
              </div>
              <div class="hitl-decline-preview" id="hitl-decline-preview" style="display:none">
                <em>Si vous déclinez :</em> le sinistre revient en file manuelle · l'IA journalise l'écart de raisonnement · le dataset de réentraînement gagne une ligne.
              </div>
            </div>
          </div>
          <div class="kpi-dashboard">
            <div class="kpi-cols">
              <div class="kpi-col">
                <div class="kpi-col-head">🎯 Baseline humaine (aujourd'hui)</div>
                <div class="kpi-row"><span>AHT moyen</span><strong>11 min 40</strong></div>
                <div class="kpi-row"><span>FCR (1er appel)</span><strong>68 %</strong></div>
                <div class="kpi-row"><span>NPS</span><strong>38</strong></div>
                <div class="kpi-row"><span>Taux abandon</span><strong>11 %</strong></div>
                <div class="kpi-row"><span>Fraude non détectée</span><strong>~8 %</strong></div>
              </div>
              <div class="kpi-col">
                <div class="kpi-col-head">✨ Run IA (cible)</div>
                <div class="kpi-row"><span>Latence p50</span><strong>4,2 s</strong></div>
                <div class="kpi-row"><span>Coût/sinistre</span><strong>€0,024</strong></div>
                <div class="kpi-row"><span>Précision</span><strong>87 %</strong></div>
                <div class="kpi-row"><span>Taux hallucination</span><strong>&lt; 2 %</strong></div>
                <div class="kpi-row"><span>SLA porte HITL</span><strong>90 s (95 %)</strong></div>
              </div>
            </div>
          </div>
        </div>`,
      onRender: () => {
        const flowNodes = [
          { id: 'rn-voice', label: 'Agent vocal ElevenLabs', kind: 'tool' },
          { id: 'rn-ai1', label: 'Classification IA', kind: 'ai' },
          { id: 'rn-gateA', label: '⚠ Porte A · fraude > 0,65', kind: 'hitl', clickable: true, gate: 'A' },
          { id: 'rn-severity', label: 'Sévérité IA', kind: 'ai' },
          { id: 'rn-gateB', label: '⚠ Porte B · sévérité haute', kind: 'hitl', clickable: true, gate: 'B' },
          { id: 'rn-letter', label: 'Lettre client IA', kind: 'ai' },
          { id: 'rn-gateC', label: '⚠ Porte C · > €4 000', kind: 'hitl', clickable: false, gate: 'C' },
          { id: 'rn-settle', label: 'Règlement Salesforce+GW', kind: 'tool' },
        ];
        const rf = document.getElementById('rehearsal-flow');
        if (rf) {
          rf.innerHTML = flowNodes.map(n => `
            <div class="rh-node rh-${n.kind}${n.clickable ? ' rh-clickable' : ''}" id="${n.id}" data-gate="${n.gate || ''}">
              <span>${n.label}</span>
              ${n.clickable ? '<span class="rh-click-hint">← cliquer</span>' : ''}
            </div>`).join('<span class="rh-edge">→</span>');
          rf.querySelectorAll('.rh-clickable').forEach(node => {
            node.addEventListener('click', () => {
              document.getElementById('hitl-sim').style.display = 'block';
            });
          });
        }
        document.getElementById('hitl-sim-close')?.addEventListener('click', () => {
          document.getElementById('hitl-sim').style.display = 'none';
        });
        document.getElementById('hitl-decline')?.addEventListener('click', () => {
          document.getElementById('hitl-decline-preview').style.display = 'block';
        });
        document.getElementById('hitl-approve')?.addEventListener('click', () => {
          document.getElementById('hitl-sim').style.display = 'none';
          appendChat({ role: 'human', by: 'Sophie M. (sim) · 14:50', body: 'Approuvé. Sinistre continué en auto.' });
        });
      },
    },
    { // 8 SUMMARY + SHIP OVERLAY
      eyebrow: 'MOUVEMENT VIII · SYNTHÈSE',
      title: 'Tout ce qu\'on a décidé, <em>sur une page.</em>',
      lede: "Lisez-la une fois. Modifiez n'importe quoi sur place — ça se propage. Quand vous êtes prêt(e), expédiez vers L1 et je le construis pour de vrai.",
      duration: 3200,
      chat: [
        { delay: 300, role: 'ai', by: 'Codex · 14:51', body: "J'ai relancé le lint complet. <strong>1 alerte non résolue :</strong> la stratégie de mesure de la porte D n'est pas définie. Corrigez ou outrepassez avant l'envoi.", citation: '↳ lint_capability_manifest · run #2 · 1 warning' },
        { delay: 2400, role: 'ai', by: 'Codex · 14:52', body: "Trois premiers appels à tester en L1 : <em>tamponnement simple</em> / <em>multi-véhicules avec sévérité ambiguë</em> / <em>raccroche en cours d’appel</em>." },
      ],
      render: () => `
        <div class="mv-summary">
          <div class="summary-lint-warn">
            ⚠ 1 alerte lint : la stratégie de mesure de la porte D n'est pas définie.
            <button class="btn btn-ghost" id="b-override-lint" style="margin-left:12px">Outrepasser</button>
          </div>
          <div class="summary-sections">
            <div class="summary-section open">
              <div class="sum-head"><span class="sum-icon">🚀</span><span class="sum-title">Identité pilote</span><span class="sum-stat">motor-fnol-tow · v0.1 · FR</span></div>
              <div class="sum-body">
                <div class="sum-field"><span>Nom</span><strong>motor-fnol-tow</strong></div>
                <div class="sum-field"><span>Version</span><strong>0.1-L0-sim</strong></div>
                <div class="sum-field"><span>Propriétaire</span><strong>Sophie M. · Claims Lyon</strong></div>
                <div class="sum-field"><span>Domaine ancre</span><strong>Motor FNOL + Tow Dispatch</strong></div>
                <div class="sum-field"><span>Langues</span><strong>FR · EN</strong></div>
                <div class="sum-field"><span>Régions</span><strong>FR · Plateau Lyon</strong></div>
              </div>
            </div>
            <div class="summary-section">
              <div class="sum-head"><span class="sum-icon">👥</span><span class="sum-title">Personas</span><span class="sum-stat">5 personas · 12 nœuds parcours</span></div>
              <div class="sum-body">Sophie M. · Marc T. · Hugo R. · Le sinistré · IT/Sécurité</div>
            </div>
            <div class="summary-section">
              <div class="sum-head"><span class="sum-icon">📚</span><span class="sum-title">Citations</span><span class="sum-stat">3 contraignantes · 9 contextuelles</span></div>
              <div class="sum-body">RGPD Art.22 · EU AI Act Art.50 · Code assurances L121-12 + 9 contextuelles</div>
            </div>
            <div class="summary-section">
              <div class="sum-head"><span class="sum-icon">🔀</span><span class="sum-title">Plan + Portes HITL</span><span class="sum-stat">14 nœuds · 4 portes · total €42 000/err</span></div>
              <div class="sum-body">A: €4 800 · B: €25 000 · C: régl. · D: €8 200</div>
            </div>
            <div class="summary-section open">
              <div class="sum-head"><span class="sum-icon">🪙</span><span class="sum-title">Cas d'affaires</span><span class="sum-stat">€280k – €420k / an · médiane €350k</span></div>
              <div class="sum-body">Volume 9 200 FNOL/mois · Précision cible 87 % · Repli humain 18 %</div>
            </div>
            <div class="summary-section">
              <div class="sum-head"><span class="sum-icon">🌱</span><span class="sum-title">Seed synthétique</span><span class="sum-stat">240 scénarios · 8 % fraude · validé</span></div>
              <div class="sum-body">schéma ✓ · distribution ✓ · anti-PII ✓ · fidélité persona ✓</div>
            </div>
            <div class="summary-section">
              <div class="sum-head"><span class="sum-icon">📜</span><span class="sum-title">Charte signée</span><span class="sum-stat">7 règles · 5 intégrations · 4 accords</span></div>
              <div class="sum-body">Porte C ≤ €4 000 · Disclosure 3 s · PII redaction · SLA 90 s</div>
            </div>
            <div class="summary-section open">
              <div class="sum-head"><span class="sum-icon">📡</span><span class="sum-title">Bundle observabilité</span><span class="sum-stat">Langfuse · 3 rubriques eval · 5 alertes</span></div>
              <div class="sum-body">
                Projet Langfuse : <code>gdai-pilot-motor-fnol-tow</code><br>
                Rubriques : factuel · politique · ton · personnalisé<br>
                Alertes : latence p95 · coût/sinistre · taux repli · hallucination · anti-PII drift
              </div>
            </div>
          </div>
          <div class="summary-ship-row">
            <button class="btn" id="b-invite-reviewer">Enregistrer &amp; inviter un relecteur · lien lecture seule</button>
            <button class="btn btn-primary" id="b-ship-l1">Générer &amp; expédier vers L1 →</button>
          </div>
        </div>
        <div class="ship-overlay" id="ship-overlay" style="display:none">
          <div class="ship-content">
            <div class="ship-check">✓</div>
            <h2 class="ship-title">Expédié vers <em>L1</em>.</h2>
            <p class="ship-sub">motor-fnol-tow · v0.1 · build <code>a3f7-21bd</code> · ancre <code>0xa3·1e</code></p>
            <div class="ship-items">
              <div class="ship-item"><span>Niveau</span><strong>L1 · Sandbox réel</strong></div>
              <div class="ship-item"><span>Feature flag</span><strong>pf_orchestrator = off · PostHog</strong></div>
              <div class="ship-item"><span>Langfuse</span><strong>gdai-pilot-motor-fnol-tow · actif</strong></div>
              <div class="ship-item"><span>Seed chargé</span><strong>240 scénarios FNOL</strong></div>
            </div>
            <div class="ship-scenarios">
              <div class="ship-sc-title">3 premiers appels recommandés en L1</div>
              <div class="ship-sc-item">1. Tamponnement simple → auto-résolution attendue</div>
              <div class="ship-sc-item">2. Multi-véhicules sévérité ambiguë → Porte B attendue</div>
              <div class="ship-sc-item">3. Raccroche mi-appel → rappel ×2 puis file manuelle</div>
            </div>
            <a class="btn btn-primary" href="./canvas.html" style="margin-top:24px">Ouvrir le canevas live →</a>
          </div>
        </div>`,
      onRender: () => {
        document.querySelectorAll('.summary-section .sum-head').forEach(h => {
          h.addEventListener('click', () => h.parentElement.classList.toggle('open'));
        });
        document.getElementById('b-override-lint')?.addEventListener('click', (e) => {
          e.target.closest('.summary-lint-warn').style.opacity = '0.4';
          e.target.textContent = '✓ Outrepassé';
          e.target.disabled = true;
        });
        document.getElementById('b-invite-reviewer')?.addEventListener('click', (e) => {
          e.target.textContent = '✓ Lien copié (simulation)';
          e.target.disabled = true;
        });
        document.getElementById('b-ship-l1')?.addEventListener('click', () => {
          const overlay = document.getElementById('ship-overlay');
          if (overlay) {
            overlay.style.display = 'flex';
            overlay.style.cssText = 'display:flex;position:fixed;inset:0;background:var(--axa-blue);z-index:9999;align-items:center;justify-content:center;animation:fadeInShip 600ms ease';
            setRunhead('EXPÉDIÉ · L1 · 8/8 MOUVEMENTS', 'azur');
          }
        });
      },
    },
  ];

  function setRunhead(text, kind) {
    const tag = $('bsim-tag');
    const txt = $('bsim-tag-text');
    if (!tag || !txt) return;
    tag.classList.remove('yellow', 'blue', 'azur');
    tag.classList.add(kind || 'yellow');
    txt.textContent = text;
  }

  function appendChat(m) {
    const stream = $('bsim-chat');
    if (!stream) return;
    const div = document.createElement('div');
    div.className = 'msg-c' + (m.role === 'ai' ? ' ai' : '');
    div.style.cssText = 'opacity:0;transform:translateY(6px);transition:opacity 320ms ease,transform 320ms ease';
    div.innerHTML = `<span class="by">${m.by}</span><p class="body">${m.body}</p>${m.citation ? `<span class="citation">${m.citation}</span>` : ''}`;
    stream.appendChild(div);
    requestAnimationFrame(() => { div.style.opacity = '1'; div.style.transform = 'translateY(0)'; });
    stream.scrollTop = stream.scrollHeight;
  }

  function typeInto(el, text, speed = 18) {
    if (!el) return;
    el.value = '';
    el.textContent = '';
    let i = 0;
    function tick() {
      if (i > text.length) return;
      const slice = text.slice(0, i);
      if ('value' in el && el.tagName !== 'PRE') el.value = slice;
      else el.textContent = slice;
      i += 1;
      const t = setTimeout(tick, speed);
      timers.push(t);
    }
    tick();
  }

  function setRailState(idx) {
    document.querySelectorAll('#bsim-steps li').forEach(li => {
      const n = +li.dataset.mv;
      li.classList.remove('done', 'active');
      if (n < idx) li.classList.add('done');
      else if (n === idx) li.classList.add('active');
    });
  }

  function setBudget(idx) {
    const tt = TOKEN_TARGETS[idx] || 0;
    const ct = COST_TARGETS[idx] || 0;
    // animate
    const startT = tokens, startC = cost;
    const dur = 700;
    const startMs = performance.now();
    function step(now) {
      const t = Math.min(1, (now - startMs) / dur);
      tokens = Math.round(startT + (tt - startT) * t);
      cost = +(startC + (ct - startC) * t).toFixed(2);
      $('bsim-tok').textContent = tokens.toLocaleString('fr-FR') + ' / 80k';
      $('bsim-cost').textContent = `€${cost.toFixed(2).replace('.', ',')} / €5,00`;
      $('bsim-bar').style.width = (idx / 8 * 100).toFixed(0) + '%';
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function renderMovement(idx) {
    const m = MOVEMENTS[idx];
    if (!m) return;
    $('bsim-eyebrow').textContent = m.eyebrow;
    $('bsim-title').innerHTML = m.title;
    $('bsim-lede').textContent = m.lede;
    const body = $('bsim-body');
    body.style.opacity = '0';
    body.style.transform = 'translateY(8px)';
    body.innerHTML = m.render();
    requestAnimationFrame(() => {
      body.style.transition = 'opacity 480ms ease, transform 480ms ease';
      body.style.opacity = '1';
      body.style.transform = 'translateY(0)';
    });
    setRailState(idx);
    setBudget(idx);
    setRunhead(`EN COURS · MOUVEMENT ${idx}/8`, 'azur');
    if (m.onRender) m.onRender();
    // Stream chat
    (m.chat || []).forEach(c => {
      const t = setTimeout(() => appendChat(c), c.delay);
      timers.push(t);
    });
  }

  function advance() {
    next();
  }

  function clearMovementTimers() {
    timers.forEach(t => clearTimeout(t));
    timers = [];
  }

  function setNavState() {
    const prevBtn = $('bsim-prev');
    const nxt = $('bsim-next');
    if (!prevBtn || !nxt) return;
    prevBtn.disabled = mvIdx <= 1;
    if (mvIdx === 0) {
      nxt.textContent = 'Démarrer →';
      nxt.disabled = false;
    } else if (mvIdx === 4 && waitingApprove) {
      nxt.textContent = 'Signoff requis ↓';
      nxt.disabled = true;
    } else if (mvIdx >= 8) {
      nxt.textContent = '✓ Terminé';
      nxt.disabled = true;
    } else {
      const labels = ['', 'Recherche →', 'Plan →', 'Cas d\'affaires →', 'Graine synthétique →', 'Charte →', 'Répétition →', 'Synthèse →'];
      nxt.textContent = labels[mvIdx] || `Mouvement ${mvIdx + 1} →`;
      nxt.disabled = false;
    }
  }

  function next() {
    if (mvIdx === 4 && waitingApprove) return;
    clearMovementTimers();
    mvIdx += 1;
    if (mvIdx > 8) { mvIdx = 8; finish(); return; }
    renderMovement(mvIdx);
    setNavState();
  }

  function prev() {
    if (mvIdx <= 1) return;
    clearMovementTimers();
    waitingApprove = false;
    mvIdx -= 1;
    renderMovement(mvIdx);
    setNavState();
  }

  function finish() {
    setRailState(9);
    setRunhead('LIVRÉ · 8/8 MOUVEMENTS', 'azur');
    setNavState();
  }

  function reset() {
    clearMovementTimers();
    mvIdx = 0;
    tokens = 0; cost = 0;
    waitingApprove = false;
    running = false;
    document.querySelectorAll('#bsim-steps li').forEach(li => li.classList.remove('done', 'active'));
    $('bsim-tok').textContent = '0 / 80k';
    $('bsim-cost').textContent = '€0,00 / €5,00';
    $('bsim-bar').style.width = '0%';
    $('bsim-chat').innerHTML = '';
    $('bsim-body').innerHTML = '';
    $('bsim-eyebrow').textContent = 'Mouvement 0 · Au repos';
    $('bsim-title').innerHTML = 'Lancez la <em>composition</em>.';
    $('bsim-lede').textContent = "Simulez les huit mouvements d'une composition de pilote — des personas à la mise en service. Précédent revient en arrière, à votre rythme. Flèches ← → ou espace pour naviguer au clavier.";
    setRunhead('AU REPOS · MOUVEMENT 0/8', 'yellow');
    setNavState();
  }

  function init() {
    if (!$('bsim-next')) return;
    $('bsim-next').addEventListener('click', next);
    $('bsim-prev').addEventListener('click', prev);
    $('bsim-reset').addEventListener('click', reset);
    document.addEventListener('keydown', (e) => {
      if (e.target.matches('input, textarea')) return;
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    });
    reset();
  }

  return { init, next, prev, reset };
})();
window.CodexBuilder = CodexBuilder;
