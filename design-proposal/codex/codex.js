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
    { from: 'cn-reserve',   to: 'cn-docling',  kind: 'queued', fromSide: 'right', toSide: 'left' },
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

  const TOKEN_TARGETS = [0, 4200, 12800, 21500, 24000, 31200, 36400, 42100, 46800];
  const COST_TARGETS  = [0, 0.21, 0.64, 1.07, 1.20, 1.56, 1.82, 2.10, 2.34];

  const MOVEMENTS = [
    null, // 1-indexed
    { // 1 INTAKE
      eyebrow: 'Movement I · Intake',
      title: 'A persona, by <em>name</em>.',
      lede: 'Codex listens for the operator behind the request, the scope of their work, and the promise the pilot must keep.',
      duration: 4200,
      chat: [
        { delay: 200, role: 'human', by: 'Claire B. · 14:38', body: "I want a fast-track for water-damage claims under €10k. Auto-resolve clean cases, escalate when policy or amount is ambiguous." },
        { delay: 1600, role: 'ai', by: 'Codex · 14:38', body: "Captured. I'll start at <strong>0.85</strong> confidence floor and a <strong>15-minute</strong> SLA — both adjustable.", citation: '↳ web_search_insurance · ACPR Art. L113-2' },
        { delay: 3200, role: 'human', by: 'Claire B. · 14:39', body: "0.85 is fine. SLA 15 min — but bump priority badge after 8 minutes idle." },
      ],
      render: () => `
        <section class="section">
          <div class="marg"><span class="num">i.</span>Persona<br>3 citations<br>L113-2 ACPR</div>
          <div class="body">
            <h3>The adjuster, by name.</h3>
            <p class="dropcap" style="font-family:var(--font-serif);font-size:18px;line-height:1.55;color:var(--ink);margin-bottom:24px">Claire B. is a property adjuster who handles roughly 120 water-damage claims per day across her region. She wants the agent to dispatch obvious cases under €4,000 — the ones she would approve in thirty seconds anyway — and keep the ambiguous ones at her desk with a packet she can act on quickly.</p>
            <div class="fields">
              <div class="field-codex"><label>Operator role</label><input id="bf-role" value="" data-target="Property adjuster"></div>
              <div class="field-codex"><label>Region · scope</label><input id="bf-scope" value="" data-target="FR · individuals · ≤ €10,000"></div>
              <div class="field-codex full"><label>Promise</label><textarea id="bf-promise" data-target="Triage water-damage claims with photo evidence. Auto-resolve high-confidence cases under €4,000. Escalate ambiguous cases within 90 seconds with a complete packet."></textarea></div>
            </div>
          </div>
        </section>`,
      onRender: () => {
        // Type each field in sequence
        const fills = [['bf-role', 0], ['bf-scope', 700], ['bf-promise', 1400]];
        fills.forEach(([id, dly]) => {
          const t = setTimeout(() => typeInto($(id), $(id).dataset.target), dly);
          timers.push(t);
        });
      },
    },
    { // 2 RESEARCH
      eyebrow: 'Movement II · Research',
      title: 'Twelve sources, <em>read for you</em>.',
      lede: 'Codex pulls policy texts, regulator memos, and historical claim cohorts. Each citation lands with a verifiable anchor.',
      duration: 4400,
      chat: [
        { delay: 200, role: 'ai', by: 'Codex · 14:39', body: "Searching policy corpus and regulator archives. <em>web_search_insurance</em>, <em>nemoclaw.policy</em>, <em>axa_corpus.search</em>." },
        { delay: 2400, role: 'ai', by: 'Codex · 14:40', body: "Twelve relevant sources. Three carry binding language — flagged for the manifest." },
      ],
      render: () => `
        <section class="section">
          <div class="marg"><span class="num">ii.</span>Citations<br>12 sources<br>3 binding</div>
          <div class="body">
            <h3>The corpus, in twelve citations.</h3>
            <p>Codex distinguishes <em>binding</em> sources (regulator, policy text) from <em>contextual</em> ones (industry whitepapers, internal heuristics). Only binding sources can constrain the LLM judge.</p>
            <ul id="cit-list" class="cit-stream" style="list-style:none;padding:0;margin-top:18px"></ul>
          </div>
        </section>`,
      onRender: () => {
        const items = [
          { tag: 'binding', title: 'ACPR — Article L113-2', sub: 'Code des assurances · disclosure obligations' },
          { tag: 'binding', title: 'AXA Property — Policy v2024.3', sub: 'water-damage clause 4.1.2 · €10k threshold' },
          { tag: 'binding', title: 'GDPR Art. 22', sub: 'automated decision-making · right to human review' },
          { tag: 'context', title: 'FFA — Annual report 2024', sub: 'water-damage claim volumes · regional medians' },
          { tag: 'context', title: 'AXA internal — Triage cohort 2023', sub: '47k closed claims · auto-resolve precision 0.93' },
          { tag: 'context', title: 'IIA — Audit guidance for AI', sub: 'sampling rules · post-hoc review intervals' },
          { tag: 'context', title: 'NemoClaw — Policy compiler v1.4', sub: 'rule precedence · confidence floor patterns' },
          { tag: 'context', title: 'Docling — Photo evidence schemas', sub: 'invoice extraction · pii redaction defaults' },
          { tag: 'context', title: 'Chatwoot — Operator handover', sub: 'SLA priority ladder · idle timers' },
          { tag: 'context', title: 'Langfuse — Evaluation rubrics', sub: 'factual · policy · tone · audit-ready' },
          { tag: 'context', title: 'AXA EU — Settlement playbook', sub: 'sub-€4k express track · 90-second SLA' },
          { tag: 'context', title: 'Property fast-track v0.3', sub: 'previous pilot iteration · learnings memo' },
        ];
        const list = $('cit-list');
        if (!list) return;
        items.forEach((it, i) => {
          const t = setTimeout(() => {
            const li = document.createElement('li');
            li.className = 'cit-row';
            li.style.cssText = 'display:flex;gap:14px;align-items:flex-start;padding:12px 0;border-bottom:1px solid var(--rule);opacity:0;transform:translateY(6px);transition:opacity 320ms ease,transform 320ms ease';
            li.innerHTML = `
              <span class="tag ${it.tag === 'binding' ? 'yellow' : 'blue'}" style="flex-shrink:0;font-size:10px"><span class="pip"></span>${it.tag}</span>
              <div style="flex:1"><div style="font-family:var(--font-serif);font-size:16px;color:var(--ink-strong);font-weight:500">${it.title}</div><div style="font-size:12px;color:var(--mute);font-family:var(--font-mono);margin-top:3px">${it.sub}</div></div>`;
            list.appendChild(li);
            requestAnimationFrame(() => { li.style.opacity = '1'; li.style.transform = 'translateY(0)'; });
          }, 200 + i * 280);
          timers.push(t);
        });
      },
    },
    { // 3 PLAN
      eyebrow: 'Movement III · Plan',
      title: 'A flow, in <em>five steps</em>.',
      lede: 'Codex drafts the topology — five nodes, two human gates. Each row reveals as the planner reasons through it.',
      duration: 3600,
      chat: [
        { delay: 200, role: 'ai', by: 'Codex · 14:40', body: "Drafting topology. Two HITL gates: confidence-driven escalation, and a final operator sign-off when amount > €4k." },
      ],
      render: () => `
        <section class="section">
          <div class="marg"><span class="num">iii.</span>Flow<br>5 nodes<br>2 HITL gates</div>
          <div class="body">
            <h3>A flow, in five steps.</h3>
            <p>The two italicised steps are <em>HITL gates</em> — they pause the run and hand control to an operator with a structured packet. Everything else runs without human attention until evidence demands it.</p>
            <div id="flow-list" class="flow-list" style="margin-top:18px"></div>
          </div>
        </section>`,
      onRender: () => {
        const rows = [
          { ix: 'i.', name: 'Intake claim', sub: 'tool · claims_facade.create_claim', tag: 'tool', kind: 'blue' },
          { ix: 'ii.', name: 'Extract evidence', sub: 'tool · docling.parse · photos + invoice → structured facts', tag: 'tool', kind: 'blue' },
          { ix: 'iii.', name: 'Decide fast-track', sub: 'llm.judge · NemoClaw policy · floor 0.85', tag: 'HITL gate', kind: 'yellow', gate: true },
          { ix: 'iv.', name: 'Operator handover', sub: 'hitl.chatwoot · packet · SLA 15 min', tag: 'HITL gate', kind: 'yellow', gate: true },
          { ix: 'v.', name: 'Settle & log', sub: 'tool · claims_facade.resolve · audit anchored', tag: 'tool', kind: 'blue' },
        ];
        const list = $('flow-list');
        if (!list) return;
        rows.forEach((r, i) => {
          const t = setTimeout(() => {
            const div = document.createElement('div');
            div.className = 'row' + (r.gate ? ' gate' : '');
            div.style.cssText = 'opacity:0;transform:translateY(6px);transition:opacity 320ms ease,transform 320ms ease';
            div.innerHTML = `<span class="ix">${r.ix}</span><div><span class="name">${r.name}<em>${r.sub}</em></span></div><span class="tag ${r.kind}"><span class="pip"></span>${r.tag}</span>`;
            list.appendChild(div);
            requestAnimationFrame(() => { div.style.opacity = '1'; div.style.transform = 'translateY(0)'; });
          }, 200 + i * 540);
          timers.push(t);
        });
      },
    },
    { // 4 APPROVE
      eyebrow: 'Movement IV · Approve',
      title: 'A pause, for <em>operator sign-off</em>.',
      lede: 'Before bytes leave the planner, Claire reviews the bundle: capability manifest, egress allow-list, HITL gates. Approve to build, or iterate aloud.',
      duration: 0, // user-driven
      chat: [
        { delay: 200, role: 'ai', by: 'Codex · 14:41', body: "Plan ready for sign-off. Bundle declares <strong>three internal tools</strong>, <strong>two private egress hosts</strong>, and <strong>two HITL gates</strong>. Approve to build." },
      ],
      render: () => `
        <section class="section">
          <div class="marg"><span class="num">iv.</span>Sign-off<br>capability +<br>egress + HITL</div>
          <div class="body">
            <h3>The bundle, awaiting <em>your</em> approval.</h3>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:22px">
              <div class="approval-tile"><span class="tile-key">Tools declared</span><span class="tile-val">3</span><span class="tile-sub">claims_facade.* · docling.parse · nemoclaw.policy</span></div>
              <div class="approval-tile"><span class="tile-key">Egress allow-list</span><span class="tile-val">2</span><span class="tile-sub">chatwoot.gdai.private · langfuse.gdai.private</span></div>
              <div class="approval-tile"><span class="tile-key">HITL gates</span><span class="tile-val">2</span><span class="tile-sub">confidence floor 0.85 · operator handover SLA 15min</span></div>
              <div class="approval-tile"><span class="tile-key">Audit anchor</span><span class="tile-val">on</span><span class="tile-sub">audit_external_anchor · hash chained on settle</span></div>
            </div>
            <div style="margin-top:32px;display:flex;gap:14px;justify-content:flex-end;align-items:center">
              <span style="font-family:var(--font-mono);font-size:11px;color:var(--mute);margin-right:auto">Awaiting Claire B. · 14:41</span>
              <button class="btn" id="b-iter">Iterate plan</button>
              <button class="btn btn-primary" id="b-approve">Approve & build →</button>
            </div>
          </div>
        </section>`,
      onRender: () => {
        waitingApprove = true;
        setRunhead('PAUSED · OPERATOR SIGN-OFF', 'yellow');
        const ap = $('b-approve');
        if (ap) ap.addEventListener('click', () => {
          if (!waitingApprove) return;
          waitingApprove = false;
          appendChat({ role: 'human', by: 'Claire B. · 14:41', body: 'Approved. Build it.' });
          advance();
        });
        const it = $('b-iter');
        if (it) it.addEventListener('click', () => {
          appendChat({ role: 'human', by: 'Claire B. · 14:41', body: 'Tighten the floor to 0.88 first.' });
          setTimeout(() => appendChat({ role: 'ai', by: 'Codex · 14:41', body: 'Logged. Floor → 0.88. Rebuilding the plan in place.' }), 800);
        });
      },
    },
    { // 5 BUILD
      eyebrow: 'Movement V · Build',
      title: 'A bundle, <em>compiled</em>.',
      lede: 'Codex generates flow.json, the capability manifest, and the audit anchor stub. Watch it type out, line by line.',
      duration: 5200,
      chat: [
        { delay: 200, role: 'ai', by: 'Codex · 14:41', body: "Compiling flow.json. Topology, manifest, anchor stub." },
        { delay: 3600, role: 'ai', by: 'Codex · 14:42', body: "Bundle compiled. <strong>2,847 bytes</strong>. Manifest is signed and ready for lint." },
      ],
      render: () => `
        <section class="section">
          <div class="marg"><span class="num">v.</span>Bundle<br>flow.json<br>2,847 bytes</div>
          <div class="body">
            <h3>The bundle, line by line.</h3>
            <div style="margin-top:18px;background:var(--ink-strong);color:#f5f4f2;border-radius:14px;overflow:hidden;font-family:var(--font-mono);font-size:13px;line-height:1.7">
              <div style="padding:12px 22px;background:rgba(255,255,255,0.04);border-bottom:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;gap:8px">
                <span style="width:9px;height:9px;border-radius:999px;background:#fb6f57"></span>
                <span style="width:9px;height:9px;border-radius:999px;background:#f6c64d"></span>
                <span style="width:9px;height:9px;border-radius:999px;background:#84cc7a"></span>
                <span style="margin-left:auto;color:rgba(245,244,242,0.5);font-size:11px;letter-spacing:0.06em">flow.json · property-fast-track · v0.4-build</span>
              </div>
              <div style="padding:24px 28px;min-height:280px"><pre id="b-code" style="margin:0;font-family:inherit;white-space:pre-wrap"></pre></div>
            </div>
          </div>
        </section>`,
      onRender: () => {
        const code = `// Generated by Codex Builder · 14:42:08
{
  "name": "property-fast-track",
  "version": "0.4",
  "capability_manifest": {
    "egress": ["chatwoot.gdai.private", "langfuse.gdai.private"],
    "tools":  ["claims_facade.*", "docling.parse", "nemoclaw.policy"],
    "hitl":   ["chatwoot.gdai.private"],
    "audit":  "audit_external_anchor"
  },
  "nodes": [
    { "id": "intake",   "kind": "tool", "ref": "claims_facade.create_claim" },
    { "id": "extract",  "kind": "tool", "ref": "docling.parse" },
    { "id": "decide",   "kind": "llm",  "judge": "nemoclaw.policy", "floor": 0.85 },
    { "id": "handover", "kind": "hitl", "channel": "chatwoot", "sla_min": 15 },
    { "id": "settle",   "kind": "tool", "ref": "claims_facade.resolve" }
  ],
  "edges": [
    "intake → extract",
    "extract → decide",
    "decide.low_conf → handover",
    "decide.high_conf → settle",
    "handover → settle"
  ]
}`;
        typeInto($('b-code'), code, 14);
      },
    },
    { // 6 LINT
      eyebrow: 'Movement VI · Lint',
      title: 'A pass, <em>refused or signed</em>.',
      lede: 'Six checks. The manifest must declare every tool the flow calls, every egress host, and zero literal secrets. Each ✓ is an invariant.',
      duration: 3200,
      chat: [
        { delay: 200, role: 'ai', by: 'Codex · 14:42', body: "Running capability lint. Six checks." },
        { delay: 2800, role: 'ai', by: 'Codex · 14:42', body: "All checks green. Bundle is sign-ready." },
      ],
      render: () => `
        <section class="section">
          <div class="marg"><span class="num">vi.</span>Lint<br>6 checks<br>0 errors</div>
          <div class="body">
            <h3>The lint, six invariants strong.</h3>
            <div id="lint-list" class="lint-stream"></div>
          </div>
        </section>`,
      onRender: () => {
        const checks = [
          'Every tool referenced in nodes is declared in capability_manifest.tools',
          'Every egress host called is listed in capability_manifest.egress',
          'No literal secrets (API keys, tokens) embedded in flow.json',
          'HITL gate channel chatwoot is bound to a private domain',
          'Audit anchor strategy is one of: external | internal | none',
          'LLM judge floor in [0.50, 0.99] — current 0.85 ✓',
        ];
        const list = $('lint-list');
        if (!list) return;
        checks.forEach((c, i) => {
          const t = setTimeout(() => {
            const row = document.createElement('div');
            row.className = 'lint-row';
            row.innerHTML = `<span class="lint-pip">⏳</span><span class="lint-text">${c}</span>`;
            list.appendChild(row);
            // Then resolve to ✓
            const t2 = setTimeout(() => {
              row.classList.add('ok');
              row.querySelector('.lint-pip').textContent = '✓';
            }, 320);
            timers.push(t2);
          }, 220 + i * 360);
          timers.push(t);
        });
      },
    },
    { // 7 PREVIEW
      eyebrow: 'Movement VII · Preview',
      title: 'A sandbox, <em>five nodes lit</em>.',
      lede: 'Codex runs one synthetic claim through the pilot in a sealed sandbox. Every node lights up. Tokens, latency, cost — all measured.',
      duration: 4400,
      chat: [
        { delay: 200, role: 'ai', by: 'Codex · 14:43', body: "Sandbox dispatched. Claim CLM-SYN-001 · €3,200 water damage · synthetic." },
        { delay: 3600, role: 'ai', by: 'Codex · 14:43', body: "Run completed. Auto-resolved. Latency p50 = 4.1s · cost €0.024 · tokens 2,840." },
      ],
      render: () => `
        <section class="section">
          <div class="marg"><span class="num">vii.</span>Sandbox<br>synthetic<br>CLM-SYN-001</div>
          <div class="body">
            <h3>A synthetic run, end-to-end.</h3>
            <div id="prev-track" class="prev-track"></div>
            <div id="prev-metrics" class="prev-metrics"></div>
          </div>
        </section>`,
      onRender: () => {
        const track = $('prev-track');
        const nodes = ['intake', 'extract', 'decide', 'settle'];
        track.innerHTML = nodes.map(n => `<div class="prev-node" data-n="${n}"><span class="prev-pip"></span><span class="prev-name">${n}</span></div>`).join('<span class="prev-edge"></span>');
        nodes.forEach((n, i) => {
          const t = setTimeout(() => {
            const el = track.querySelector(`[data-n="${n}"]`);
            if (el) el.classList.add('lit');
          }, 400 + i * 700);
          timers.push(t);
        });
        const t2 = setTimeout(() => {
          $('prev-metrics').innerHTML = `
            <div class="prev-met"><span>Latency p50</span><strong>4.1s</strong></div>
            <div class="prev-met"><span>Cost</span><strong>€0.024</strong></div>
            <div class="prev-met"><span>Tokens</span><strong>2,840</strong></div>
            <div class="prev-met"><span>Verdict</span><strong style="color:var(--axa-azur)">auto-resolve</strong></div>`;
        }, 3400);
        timers.push(t2);
      },
    },
    { // 8 DEPLOY
      eyebrow: 'Movement VIII · Deploy',
      title: 'A pilot, <em>shipped to G0</em>.',
      lede: 'Bundle signed. Anchored on audit chain. Live behind feature flag pf_orchestrator at 0% — promote when ready.',
      duration: 2200,
      chat: [
        { delay: 200, role: 'ai', by: 'Codex · 14:43', body: "Deploying to G0 ring. <em>railway.deploy</em>, <em>posthog.flag.create</em>." },
        { delay: 1600, role: 'ai', by: 'Codex · 14:43', body: "<strong>Shipped.</strong> property-fast-track v0.4 is live behind <code>pf_orchestrator</code> at 0%. Open the canvas to watch a real run." },
      ],
      render: () => `
        <section class="section">
          <div class="marg"><span class="num">viii.</span>Deploy<br>G0 ring<br>0% rollout</div>
          <div class="body" id="deploy-body" style="opacity:0;transform:translateY(8px);transition:opacity 600ms ease,transform 600ms ease">
            <div style="background:linear-gradient(180deg,#fffbf3,#fff);border:1px solid var(--rule);border-radius:18px;padding:38px 44px;text-align:center">
              <div style="display:inline-flex;width:52px;height:52px;border-radius:50%;background:#84cc7a;color:#fff;align-items:center;justify-content:center;font-size:24px;margin-bottom:14px;box-shadow:0 0 0 8px rgba(132,204,122,0.18)">✓</div>
              <h3 style="margin:0 0 6px 0;font-family:var(--font-serif);font-weight:500;font-size:32px;letter-spacing:-0.025em;color:var(--ink-strong)">Shipped to G0.</h3>
              <p style="font-family:var(--font-serif);font-style:italic;font-size:18px;color:var(--ink-mute);margin:0 0 24px 0">property-fast-track v0.4 · build 7f4a-31bd · audit anchor 0xa3·1e</p>
              <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin:24px 0">
                <div class="approval-tile"><span class="tile-key">Ring</span><span class="tile-val">G0</span><span class="tile-sub">canary · 0% traffic</span></div>
                <div class="approval-tile"><span class="tile-key">Flag</span><span class="tile-val">off</span><span class="tile-sub">pf_orchestrator · posthog</span></div>
                <div class="approval-tile"><span class="tile-key">Audit</span><span class="tile-val">anchored</span><span class="tile-sub">0xa3·1e · external chain</span></div>
                <div class="approval-tile"><span class="tile-key">Healthcheck</span><span class="tile-val">200</span><span class="tile-sub">latency p50 87ms</span></div>
              </div>
              <div style="display:flex;gap:14px;justify-content:center;margin-top:18px">
                <button class="btn" id="b-promote">Promote to G1 · 5%</button>
                <a class="btn btn-primary" href="./canvas.html">Open canvas →</a>
              </div>
            </div>
          </div>
        </section>`,
      onRender: () => {
        const t = setTimeout(() => {
          const b = $('deploy-body');
          if (b) { b.style.opacity = '1'; b.style.transform = 'translateY(0)'; }
        }, 200);
        timers.push(t);
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
      $('bsim-tok').textContent = tokens.toLocaleString() + ' / 80k';
      $('bsim-cost').textContent = `€${cost.toFixed(2)} / €5.00`;
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
    setRunhead(`RUNNING · MOVEMENT ${idx}/8`, 'azur');
    if (m.onRender) m.onRender();
    // Stream chat
    (m.chat || []).forEach(c => {
      const t = setTimeout(() => appendChat(c), c.delay);
      timers.push(t);
    });
  }

  function advance() {
    mvIdx += 1;
    if (mvIdx > 8) return finish();
    renderMovement(mvIdx);
    if (mvIdx === 4) {
      // wait for user click
      setRunhead('PAUSED · OPERATOR SIGN-OFF', 'yellow');
      return;
    }
    const m = MOVEMENTS[mvIdx];
    const t = setTimeout(advance, m.duration);
    timers.push(t);
  }

  function finish() {
    setRailState(9); // all done
    setRunhead('SHIPPED · 8/8 MOVEMENTS', 'azur');
    $('bsim-play').textContent = '▶ Replay simulation';
    running = false;
  }

  function start() {
    if (running) return;
    if (mvIdx >= 8) reset();
    running = true;
    $('bsim-play').textContent = 'Running…';
    $('bsim-play').disabled = true;
    advance();
  }

  function reset() {
    timers.forEach(t => clearTimeout(t));
    timers = [];
    mvIdx = 0;
    tokens = 0; cost = 0;
    waitingApprove = false;
    running = false;
    document.querySelectorAll('#bsim-steps li').forEach(li => li.classList.remove('done', 'active'));
    $('bsim-tok').textContent = '0 / 80k';
    $('bsim-cost').textContent = '€0.00 / €5.00';
    $('bsim-bar').style.width = '0%';
    $('bsim-chat').innerHTML = '';
    $('bsim-body').innerHTML = '';
    $('bsim-eyebrow').textContent = 'Movement 0 · Idle';
    $('bsim-title').innerHTML = 'Press <em>play</em> to compose.';
    $('bsim-lede').textContent = 'Simulate the eight movements of a pilot composition — from intake through deploy — with fake content streaming end-to-end.';
    $('bsim-play').textContent = '▶ Play simulation';
    $('bsim-play').disabled = false;
    setRunhead('IDLE · MOVEMENT 0/8', 'yellow');
  }

  function init() {
    if (!$('bsim-play')) return; // not on builder page
    $('bsim-play').addEventListener('click', start);
    $('bsim-reset').addEventListener('click', reset);
    reset();
  }

  return { init, start, reset, advance };
})();
window.CodexBuilder = CodexBuilder;
