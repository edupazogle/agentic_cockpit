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

  const TOKEN_TARGETS = [0, 4200, 12800, 21500, 24000, 31200, 36400, 42100, 46800];
  const COST_TARGETS  = [0, 0.21, 0.64, 1.07, 1.20, 1.56, 1.82, 2.10, 2.34];

  const MOVEMENTS = [
    null, // 1-indexed
    { // 1 INTAKE
      eyebrow: 'Mouvement I · Prise en charge',
      title: 'Un persona, <em>par son nom</em>.',
      lede: "Codex écoute l'opératrice derrière la requête, le périmètre de son travail, et la promesse que le pilote doit tenir.",
      duration: 4200,
      chat: [
        { delay: 200, role: 'human', by: 'Claire B. · 14:38', body: "Je veux une voie express pour les sinistres dégât-des-eaux sous 10 k€. Auto-résolution des cas nets, escalade dès que la police ou le montant est ambigu." },
        { delay: 1600, role: 'ai', by: 'Codex · 14:38', body: "Noté. Je démarre à un seuil de confiance <strong>0,85</strong> et un SLA de <strong>15 minutes</strong> — les deux ajustables.", citation: '↳ web_search_insurance · ACPR Art. L113-2' },
        { delay: 3200, role: 'human', by: 'Claire B. · 14:39', body: "0,85, ça me va. SLA 15 min — mais badge prioritaire après 8 minutes d'inactivité." },
      ],
      render: () => `
        <section class="section">
          <div class="marg"><span class="num">i.</span>Persona<br>3 citations<br>L113-2 ACPR</div>
          <div class="body">
            <h3>L'experte, <em>par son nom</em>.</h3>
            <p class="dropcap">Claire B. est experte dommages aux biens. Elle traite environ 120 sinistres dégât-des-eaux par jour sur sa région. Elle veut que l'agent expédie les cas évidents sous 4 000 € — ceux qu'elle approuverait en trente secondes — et garde les cas ambigus sur son bureau avec un dossier exploitable en un clin d'œil.</p>
            <div class="fields">
              <div class="field-codex"><label>Rôle opérateur</label><input id="bf-role" value="" data-target="Experte dommages aux biens"></div>
              <div class="field-codex"><label>Région · périmètre</label><input id="bf-scope" value="" data-target="FR · particuliers · ≤ 10 000 €"></div>
              <div class="field-codex full"><label>Promesse</label><textarea id="bf-promise" data-target="Trier les sinistres dégât-des-eaux avec preuves photo. Auto-résoudre les cas à haute confiance sous 4 000 €. Escalader les cas ambigus en moins de 90 s avec un dossier complet."></textarea></div>
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
      eyebrow: 'Mouvement II · Recherche',
      title: 'Douze sources, <em>lues pour vous</em>.',
      lede: "Codex parcourt textes de polices, mémos régulateurs et cohortes historiques. Chaque citation atterrit avec une ancre vérifiable.",
      duration: 4400,
      chat: [
        { delay: 200, role: 'ai', by: 'Codex · 14:39', body: "Recherche dans le corpus polices et archives régulateur. <em>web_search_insurance</em>, <em>nemoclaw.policy</em>, <em>axa_corpus.search</em>." },
        { delay: 2400, role: 'ai', by: 'Codex · 14:40', body: "Douze sources pertinentes. Trois portent un langage <strong>contraignant</strong> — signalées dans le manifeste." },
      ],
      render: () => `
        <section class="section">
          <div class="marg"><span class="num">ii.</span>Citations<br>12 sources<br>3 contraignantes</div>
          <div class="body">
            <h3>Le corpus, en douze citations.</h3>
            <p>Codex distingue les sources <em>contraignantes</em> (régulateur, texte de police) des sources <em>contextuelles</em> (livres blancs, heuristiques internes). Seules les contraignantes peuvent contraindre le juge LLM.</p>
            <ul id="cit-list" class="cit-stream"></ul>
          </div>
        </section>`,
      onRender: () => {
        const items = [
          { tag: 'contraignant', kind: 'yellow', title: 'ACPR — Article L113-2', sub: "Code des assurances · obligations d'information" },
          { tag: 'contraignant', kind: 'yellow', title: 'AXA Property — Police v2024.3', sub: 'clause dégât-des-eaux 4.1.2 · seuil 10 k€' },
          { tag: 'contraignant', kind: 'yellow', title: 'RGPD Art. 22', sub: "décision automatisée · droit à la revue humaine" },
          { tag: 'contexte', kind: 'blue', title: 'FFA — Rapport annuel 2024', sub: 'volumes dégât-des-eaux · médianes régionales' },
          { tag: 'contexte', kind: 'blue', title: 'AXA interne — Cohorte triage 2023', sub: '47 k sinistres clos · précision auto-résolution 0,93' },
          { tag: 'contexte', kind: 'blue', title: 'IFACI — Audit IA', sub: "règles d'échantillonnage · revues post-hoc" },
          { tag: 'contexte', kind: 'blue', title: 'NemoClaw — Compilateur de polices v1.4', sub: 'précédence des règles · seuils de confiance' },
          { tag: 'contexte', kind: 'blue', title: 'Docling — Schémas preuves photo', sub: 'extraction factures · redaction PII par défaut' },
          { tag: 'contexte', kind: 'blue', title: 'Chatwoot — Passation opérateur', sub: 'échelle SLA · timers d\'inactivité' },
          { tag: 'contexte', kind: 'blue', title: 'Langfuse — Rubriques d\'évaluation', sub: 'factuel · police · ton · audit-ready' },
          { tag: 'contexte', kind: 'blue', title: 'AXA EU — Playbook règlement', sub: 'voie express sub-4 k€ · SLA 90 s' },
          { tag: 'contexte', kind: 'blue', title: 'Property fast-track v0.3', sub: 'pilote précédent · mémo retours' },
        ];
        const list = $('cit-list');
        if (!list) return;
        items.forEach((it, i) => {
          const t = setTimeout(() => {
            const li = document.createElement('li');
            li.className = 'cit-row';
            li.style.cssText = 'opacity:0;transform:translateY(6px);transition:opacity 320ms ease,transform 320ms ease';
            li.innerHTML = `
              <span class="tag ${it.kind}"><span class="pip"></span>${it.tag}</span>
              <div><div style="font-family:var(--font-display);font-weight:500;font-size:15.5px;color:var(--gray-1000);letter-spacing:-0.01em">${it.title}</div><div style="font-size:12px;color:var(--gray-500);font-family:var(--font-mono);margin-top:3px">${it.sub}</div></div>`;
            list.appendChild(li);
            requestAnimationFrame(() => { li.style.opacity = '1'; li.style.transform = 'translateY(0)'; });
          }, 200 + i * 280);
          timers.push(t);
        });
      },
    },
    { // 3 PLAN
      eyebrow: 'Mouvement III · Plan',
      title: 'Un flux, en <em>cinq étapes</em>.',
      lede: 'Codex esquisse la topologie — cinq nœuds, deux portes humaines. Chaque ligne se révèle au rythme du raisonnement.',
      duration: 3600,
      chat: [
        { delay: 200, role: 'ai', by: 'Codex · 14:40', body: "Brouillon de topologie. Deux portes HITL : escalade par confiance, et signoff opérateur final si montant > 4 k€." },
      ],
      render: () => `
        <section class="section">
          <div class="marg"><span class="num">iii.</span>Flux<br>5 nœuds<br>2 portes HITL</div>
          <div class="body">
            <h3>Un flux, en cinq étapes.</h3>
            <p>Les deux étapes en italique sont des <em>portes HITL</em> — elles mettent le run en pause et passent la main à un opérateur avec un dossier structuré. Tout le reste s'exécute sans intervention humaine, jusqu'à ce que la preuve l'exige.</p>
            <div id="flow-list" class="flow-list"></div>
          </div>
        </section>`,
      onRender: () => {
        const rows = [
          { ix: 'i.', name: 'Réception sinistre', sub: 'tool · claims_facade.create_claim', tag: 'tool', kind: 'blue' },
          { ix: 'ii.', name: 'Extraction des preuves', sub: 'tool · docling.parse · photos + facture → faits structurés', tag: 'tool', kind: 'blue' },
          { ix: 'iii.', name: 'Décider voie express', sub: 'llm.judge · NemoClaw · seuil 0,85', tag: 'porte HITL', kind: 'yellow', gate: true },
          { ix: 'iv.', name: 'Passation opérateur', sub: 'hitl.chatwoot · dossier · SLA 15 min', tag: 'porte HITL', kind: 'yellow', gate: true },
          { ix: 'v.', name: 'Régler & journaliser', sub: 'tool · claims_facade.resolve · audit ancré', tag: 'tool', kind: 'blue' },
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
      eyebrow: 'Mouvement IV · Approbation',
      title: 'Une pause, pour <em>signoff opérateur</em>.',
      lede: "Avant qu'un seul octet ne quitte le planificateur, Claire revoit le bundle : manifeste de capacités, allow-list de sortie, portes HITL. Approuve pour construire, ou itère à voix haute.",
      duration: 0,
      chat: [
        { delay: 200, role: 'ai', by: 'Codex · 14:41', body: "Plan prêt pour signoff. Le bundle déclare <strong>trois outils internes</strong>, <strong>deux hôtes de sortie privés</strong>, et <strong>deux portes HITL</strong>. Approuve pour construire." },
      ],
      render: () => `
        <section class="section">
          <div class="marg"><span class="num">iv.</span>Signoff<br>capacités +<br>sortie + HITL</div>
          <div class="body">
            <h3>Le bundle, en attente de <em>votre</em> approbation.</h3>
            <div class="bsim-approve">
              <h4>Manifeste de capacités · v0.4-rc</h4>
              <div class="bsim-approve-grid">
                <div class="bsim-cap-tile"><span class="k">Outils déclarés</span><span class="v">3 · <code>claims_facade.*</code> · <code>docling.parse</code> · <code>nemoclaw.policy</code></span></div>
                <div class="bsim-cap-tile"><span class="k">Sortie · allow-list</span><span class="v">2 · <code>chatwoot.gdai.private</code> · <code>langfuse.gdai.private</code></span></div>
                <div class="bsim-cap-tile"><span class="k">Portes HITL</span><span class="v">2 · seuil 0,85 · SLA 15 min</span></div>
                <div class="bsim-cap-tile"><span class="k">Ancre d'audit</span><span class="v">on · <code>audit_external_anchor</code></span></div>
                <div class="bsim-cap-tile"><span class="k">Budget pilote</span><span class="v">80 k tokens · 5,00 €</span></div>
                <div class="bsim-cap-tile"><span class="k">PII</span><span class="v">redaction par défaut</span></div>
              </div>
              <div class="bsim-approve-actions">
                <span class="hint">En attente de Claire B. · 14:41</span>
                <button class="btn" id="b-iter">Itérer le plan</button>
                <button class="btn btn-primary" id="b-approve">Approuver &amp; construire →</button>
              </div>
            </div>
          </div>
        </section>`,
      onRender: () => {
        waitingApprove = true;
        setRunhead('PAUSE · SIGNOFF OPÉRATEUR', 'yellow');
        const ap = $('b-approve');
        if (ap) ap.addEventListener('click', () => {
          if (!waitingApprove) return;
          waitingApprove = false;
          appendChat({ role: 'human', by: 'Claire B. · 14:41', body: 'Approuvé. Construis-le.' });
          advance();
        });
        const it = $('b-iter');
        if (it) it.addEventListener('click', () => {
          appendChat({ role: 'human', by: 'Claire B. · 14:41', body: 'Resserre d\'abord le seuil à 0,88.' });
          setTimeout(() => appendChat({ role: 'ai', by: 'Codex · 14:41', body: 'Noté. Seuil → 0,88. Plan reconstruit.' }), 800);
        });
      },
    },
    { // 5 BUILD
      eyebrow: 'Mouvement V · Construction',
      title: 'Un bundle, <em>compilé</em>.',
      lede: "Codex génère flow.json, le manifeste de capacités, et le stub d'ancre d'audit. Regardez-le se taper, ligne par ligne.",
      duration: 5200,
      chat: [
        { delay: 200, role: 'ai', by: 'Codex · 14:41', body: "Compilation flow.json. Topologie, manifeste, stub d'ancre." },
        { delay: 3600, role: 'ai', by: 'Codex · 14:42', body: "Bundle compilé. <strong>2 847 octets</strong>. Manifeste signé, prêt pour le lint." },
      ],
      render: () => `
        <section class="section">
          <div class="marg"><span class="num">v.</span>Bundle<br>flow.json<br>2 847 octets</div>
          <div class="body">
            <h3>Le bundle, ligne par ligne.</h3>
            <div class="bsim-codeblock">
              <div style="padding:12px 22px;background:rgba(255,255,255,0.04);border-bottom:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;gap:8px">
                <span style="width:9px;height:9px;border-radius:999px;background:#fb6f57"></span>
                <span style="width:9px;height:9px;border-radius:999px;background:#f6c64d"></span>
                <span style="width:9px;height:9px;border-radius:999px;background:#84cc7a"></span>
                <span style="margin-left:auto;color:rgba(245,244,242,0.5);font-size:11px;letter-spacing:0.06em;font-family:var(--font-mono)">flow.json · property-fast-track · v0.4-build</span>
              </div>
              <div style="padding:24px 28px;min-height:280px"><pre id="b-code"></pre></div>
            </div>
          </div>
        </section>`,
      onRender: () => {
        const code = `// Généré par Codex Builder · 14:42:08
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
      eyebrow: 'Mouvement VI · Lint',
      title: 'Six invariants, <em>tous verts</em>.',
      lede: "Six contrôles. Le manifeste doit déclarer chaque outil appelé, chaque hôte de sortie, et zéro secret littéral. Chaque ✓ est un invariant.",
      duration: 3200,
      chat: [
        { delay: 200, role: 'ai', by: 'Codex · 14:42', body: "Lint des capacités en cours. Six contrôles." },
        { delay: 2800, role: 'ai', by: 'Codex · 14:42', body: "Tous les contrôles verts. Bundle prêt à signer." },
      ],
      render: () => `
        <section class="section">
          <div class="marg"><span class="num">vi.</span>Lint<br>6 contrôles<br>0 erreur</div>
          <div class="body">
            <h3>Le lint, six invariants forts.</h3>
            <div id="lint-list" class="lint-stream"></div>
          </div>
        </section>`,
      onRender: () => {
        const checks = [
          'Chaque outil référencé dans les nœuds est déclaré dans capability_manifest.tools',
          'Chaque hôte de sortie appelé est listé dans capability_manifest.egress',
          'Aucun secret littéral (clé API, token) embarqué dans flow.json',
          'La porte HITL chatwoot est liée à un domaine privé',
          'Stratégie d\'ancre d\'audit ∈ { external, internal, none }',
          'Seuil du juge LLM ∈ [0,50 ; 0,99] — courant 0,85 ✓',
        ];
        const list = $('lint-list');
        if (!list) return;
        checks.forEach((c, i) => {
          const t = setTimeout(() => {
            const row = document.createElement('div');
            row.className = 'lint-row';
            row.innerHTML = `<span class="lint-pip">⏳</span><span class="lint-text">${c}</span>`;
            list.appendChild(row);
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
      eyebrow: 'Mouvement VII · Aperçu',
      title: 'Un sandbox, <em>cinq nœuds allumés</em>.',
      lede: "Codex passe un sinistre synthétique dans le pilote, en bac à sable scellé. Chaque nœud s'allume. Tokens, latence, coût — tout est mesuré.",
      duration: 4400,
      chat: [
        { delay: 200, role: 'ai', by: 'Codex · 14:43', body: "Sandbox lancé. Sinistre <code>CLM-SYN-001</code> · 3 200 € dégât-des-eaux · synthétique." },
        { delay: 3600, role: 'ai', by: 'Codex · 14:43', body: "Run terminé. Auto-résolu. Latence p50 = 4,1 s · coût 0,024 € · 2 840 tokens." },
      ],
      render: () => `
        <section class="section">
          <div class="marg"><span class="num">vii.</span>Sandbox<br>synthétique<br>CLM-SYN-001</div>
          <div class="body">
            <h3>Un run synthétique, de bout en bout.</h3>
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
            <div class="prev-met"><span>Latence p50</span><strong>4,1 s</strong></div>
            <div class="prev-met"><span>Coût</span><strong>0,024 €</strong></div>
            <div class="prev-met"><span>Tokens</span><strong>2 840</strong></div>
            <div class="prev-met"><span>Verdict</span><strong>auto-résolu</strong></div>`;
        }, 3400);
        timers.push(t2);
      },
    },
    { // 8 DEPLOY
      eyebrow: 'Mouvement VIII · Déploiement',
      title: 'Un pilote, <em>livré en G0</em>.',
      lede: "Bundle signé. Ancré sur la chaîne d'audit. Vivant derrière le feature flag pf_orchestrator à 0 % — promotion à votre signal.",
      duration: 3200,
      chat: [
        { delay: 200, role: 'ai', by: 'Codex · 14:43', body: "Déploiement vers l'anneau G0. <em>railway.deploy</em>, <em>posthog.flag.create</em>." },
        { delay: 1600, role: 'ai', by: 'Codex · 14:43', body: "<strong>Livré.</strong> property-fast-track v0.4 est en ligne derrière <code>pf_orchestrator</code> à 0 %. Ouvrez le canevas pour voir un vrai run." },
      ],
      render: () => `
        <section class="section">
          <div class="marg"><span class="num">viii.</span>Déploiement<br>anneau G0<br>0 % rollout</div>
          <div class="body" id="deploy-body" style="opacity:0;transform:translateY(8px);transition:opacity 600ms ease,transform 600ms ease">
            <div class="bsim-deploy">
              <div class="bsim-deploy-check">✓</div>
              <h3>Livré en <em>G0</em>.</h3>
              <p class="sub">property-fast-track · v0.4 · build 7f4a-31bd · ancre 0xa3·1e</p>
              <div class="bsim-deploy-grid">
                <div class="approval-tile"><span class="tile-key">Anneau</span><span class="tile-val">G0</span><span class="tile-sub">canary · 0 % trafic</span></div>
                <div class="approval-tile"><span class="tile-key">Flag</span><span class="tile-val">off</span><span class="tile-sub">pf_orchestrator · posthog</span></div>
                <div class="approval-tile"><span class="tile-key">Audit</span><span class="tile-val">ancré</span><span class="tile-sub">0xa3·1e · chaîne externe</span></div>
                <div class="approval-tile"><span class="tile-key">Healthcheck</span><span class="tile-val">200</span><span class="tile-sub">latence p50 87 ms</span></div>
              </div>
              <div class="bsim-deploy-actions">
                <button class="btn" id="b-promote">Promouvoir vers G1 · 5 %</button>
                <a class="btn btn-primary" href="./canvas.html">Ouvrir le canevas →</a>
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
    setRunhead('LIVRÉ · 8/8 MOUVEMENTS', 'azur');
    $('bsim-play').textContent = '▶ Rejouer la simulation';
    $('bsim-play').disabled = false;
    running = false;
  }

  function start() {
    if (running) return;
    if (mvIdx >= 8) reset();
    running = true;
    $('bsim-play').textContent = 'En cours…';
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
    $('bsim-cost').textContent = '€0,00 / €5,00';
    $('bsim-bar').style.width = '0%';
    $('bsim-chat').innerHTML = '';
    $('bsim-body').innerHTML = '';
    $('bsim-eyebrow').textContent = 'Mouvement 0 · Au repos';
    $('bsim-title').innerHTML = 'Lancez la <em>composition</em>.';
    $('bsim-lede').textContent = "Simulez les huit mouvements d'une composition de pilote — de la prise en charge au déploiement — avec un contenu factice qui se diffuse en bout-en-bout.";
    $('bsim-play').textContent = '▶ Lancer la simulation';
    $('bsim-play').disabled = false;
    setRunhead('AU REPOS · MOUVEMENT 0/8', 'yellow');
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
