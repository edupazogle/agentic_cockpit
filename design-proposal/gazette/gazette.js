// GAZETTE — pan/zoom + edges + replay choreography + MCP/HITL animations

(function () {
  const NS = 'http://www.w3.org/2000/svg';

  function transformOf(el) {
    const m = el.style.transform.match(/translate\(([\-\d.]+)px,\s*([\-\d.]+)px\)\s*scale\(([\d.]+)\)/);
    return m ? { tx: +m[1], ty: +m[2], s: +m[3] } : { tx: 0, ty: 0, s: 1 };
  }

  // PAN / ZOOM
  function initCanvasG(stage) {
    let scale = 1, tx = 40, ty = 80;
    let panning = false, lastX = 0, lastY = 0;

    function apply() {
      stage.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
      const bg = stage.parentElement.querySelector('.canvas-bg-g');
      if (bg) bg.style.backgroundPosition = `${tx}px ${ty}px`;
      const r = document.querySelector('.zoombar-g .r');
      if (r) r.textContent = Math.round(scale * 100) + '%';
      // sync edge layer transform
      const svg = document.getElementById('edges-g');
      if (svg) {
        svg.style.transform = stage.style.transform;
        svg.style.transformOrigin = '0 0';
      }
    }

    function onDown(e) {
      if (e.target.closest('.node-g, .toolbar-g, .runinfo-g, .zoombar-g, .minimap-g, .inspector-g, .activity-g, .hitl-banner-g')) return;
      panning = true; lastX = e.clientX; lastY = e.clientY;
      stage.parentElement.style.cursor = 'grabbing';
    }
    function onMove(e) { if (!panning) return; tx += e.clientX - lastX; ty += e.clientY - lastY; lastX = e.clientX; lastY = e.clientY; apply(); }
    function onUp() { panning = false; stage.parentElement.style.cursor = ''; }

    function onWheel(e) {
      if (!e.target.closest('.canvas-shell-g')) return;
      e.preventDefault();
      const next = Math.min(2, Math.max(0.4, scale - e.deltaY * 0.0015));
      const rect = stage.parentElement.getBoundingClientRect();
      const px = e.clientX - rect.left, py = e.clientY - rect.top;
      const k = next / scale;
      tx = px - (px - tx) * k; ty = py - (py - ty) * k; scale = next;
      apply();
    }

    document.querySelectorAll('[data-zg]').forEach(b => b.addEventListener('click', () => {
      const a = b.dataset.zg;
      if (a === 'in') scale = Math.min(2, scale + 0.1);
      else if (a === 'out') scale = Math.max(0.4, scale - 0.1);
      else if (a === 'fit') { scale = 1; tx = 40; ty = 80; }
      apply();
    }));

    stage.parentElement.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    stage.parentElement.addEventListener('wheel', onWheel, { passive: false });
    apply();
  }

  function bezierG(x1, y1, x2, y2) {
    const dx = Math.max(80, Math.abs(x2 - x1) * 0.55);
    return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
  }

  function getEdgePoints(fromEl, toEl, stageEl) {
    const stageRect = stageEl.getBoundingClientRect();
    const m = transformOf(stageEl);
    const ar = fromEl.getBoundingClientRect();
    const br = toEl.getBoundingClientRect();
    return {
      x1: (ar.right - stageRect.left) / m.s,
      y1: (ar.top + ar.height / 2 - stageRect.top) / m.s,
      x2: (br.left - stageRect.left) / m.s,
      y2: (br.top + br.height / 2 - stageRect.top) / m.s,
    };
  }

  function drawEdgesG(edges, svg, stageEl) {
    if (!svg) return;
    svg.innerHTML = '';
    edges.forEach((e, i) => {
      const a = document.getElementById(e.from);
      const b = document.getElementById(e.to);
      if (!a || !b) return;
      const p = getEdgePoints(a, b, stageEl);
      const path = document.createElementNS(NS, 'path');
      path.setAttribute('d', bezierG(p.x1, p.y1, p.x2, p.y2));
      path.setAttribute('class', 'edge-g ' + (e.kind || ''));
      path.setAttribute('id', 'eg-' + i);
      path.dataset.from = e.from;
      path.dataset.to = e.to;
      svg.appendChild(path);
    });
  }

  // Replay choreography — illuminate steps in sequence with a particle running each edge
  async function replayG(edges, options = {}) {
    const stage = document.getElementById('pan-g');
    const svg = document.getElementById('edges-g');
    if (!stage || !svg) return;

    // 1. reset all nodes to dim
    const nodes = stage.querySelectorAll('.node-g');
    nodes.forEach(n => { n.classList.remove('ignite', 'mcp-active'); });

    // start sequence node = first edge's from
    if (!edges.length) return;

    const ignite = (id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.remove('ignite');
      void el.offsetWidth;
      el.classList.add('ignite');
    };

    const wait = (ms) => new Promise(r => setTimeout(r, ms));

    // ignite first
    ignite(edges[0].from);
    await wait(420);

    for (let i = 0; i < edges.length; i++) {
      const e = edges[i];
      const a = document.getElementById(e.from);
      const b = document.getElementById(e.to);
      if (!a || !b) continue;
      const p = getEdgePoints(a, b, stage);
      const d = bezierG(p.x1, p.y1, p.x2, p.y2);

      // overlay path with replay class
      const overlay = document.createElementNS(NS, 'path');
      overlay.setAttribute('d', d);
      overlay.setAttribute('class', 'edge-g replay');
      svg.appendChild(overlay);

      // particle
      const particle = document.createElementNS(NS, 'circle');
      particle.setAttribute('r', '4');
      particle.setAttribute('class', 'edge-particle-g');
      particle.setAttribute('cx', p.x1);
      particle.setAttribute('cy', p.y1);
      const anim = document.createElementNS(NS, 'animateMotion');
      anim.setAttribute('dur', '720ms');
      anim.setAttribute('repeatCount', '1');
      anim.setAttribute('fill', 'freeze');
      anim.setAttribute('path', d);
      particle.appendChild(anim);
      svg.appendChild(particle);
      anim.beginElement();

      // wait a bit then ignite next + show MCP if specified
      await wait(700);
      // remove particle so it doesn't stack
      particle.remove();
      ignite(e.to);

      // if this edge produces a MCP call, show it
      if (e.mcp) {
        const node = document.getElementById(e.to);
        if (node) {
          node.classList.add('mcp-active');
          await wait(900);
          node.classList.remove('mcp-active');
        }
      } else {
        await wait(180);
      }
    }
  }

  // Trigger MCP burst on a node (manual)
  function mcpBurstG(nodeId, durationMs = 1400) {
    const el = document.getElementById(nodeId);
    if (!el) return;
    el.classList.add('mcp-active');
    setTimeout(() => el.classList.remove('mcp-active'), durationMs);
  }

  // Inspector tab switching
  function initInspectorTabs() {
    document.querySelectorAll('.insp-tabs .tab').forEach(t => {
      t.addEventListener('click', () => {
        const tabs = t.parentElement.querySelectorAll('.tab');
        tabs.forEach(x => x.classList.remove('active'));
        t.classList.add('active');
        const target = t.dataset.target;
        const panes = document.querySelectorAll('.insp-pane');
        panes.forEach(p => p.classList.toggle('active', p.dataset.pane === target));
      });
    });
    // operator option selection
    document.querySelectorAll('.op-opt').forEach(o => {
      o.addEventListener('click', () => {
        document.querySelectorAll('.op-opt').forEach(x => x.classList.remove('selected'));
        o.classList.add('selected');
      });
    });
    // node click → ensure inspector open & populate (basic stub: show drawer)
    document.querySelectorAll('.node-g').forEach(n => {
      n.addEventListener('click', () => {
        document.querySelectorAll('.node-g').forEach(x => x.classList.remove('selected'));
        n.classList.add('selected');
        const drawer = document.querySelector('.inspector-g');
        if (drawer) drawer.classList.add('open');
      });
    });
    // close
    document.querySelectorAll('.insp-head .close').forEach(b => b.addEventListener('click', () => {
      document.querySelector('.inspector-g').classList.remove('open');
      document.querySelectorAll('.node-g').forEach(x => x.classList.remove('selected'));
    }));
  }

  // Activity dock toggle
  function initActivityDock() {
    const dock = document.querySelector('.activity-g');
    if (!dock) return;
    const head = dock.querySelector('.head');
    if (head) head.addEventListener('click', (e) => {
      if (e.target.closest('.filter-chip')) return;
      if (dock.classList.contains('tall')) {
        dock.classList.remove('tall');
      } else if (dock.classList.contains('open')) {
        dock.classList.add('tall');
      } else {
        dock.classList.add('open');
      }
    });
    dock.querySelectorAll('.filter-chip').forEach(c => c.addEventListener('click', () => c.classList.toggle('on')));
  }

  // Hotkeys for operator decisions (1/2/3)
  function initHotkeys() {
    window.addEventListener('keydown', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      const map = { '1': 0, '2': 1, '3': 2 };
      if (e.key in map) {
        const opts = document.querySelectorAll('.op-opt');
        if (opts[map[e.key]]) opts[map[e.key]].click();
      }
      if (e.key === 'r' || e.key === 'R') {
        const btn = document.querySelector('.replay-btn');
        if (btn) btn.click();
      }
      if (e.key === 'Escape') {
        document.querySelector('.inspector-g')?.classList.remove('open');
        document.querySelectorAll('.node-g').forEach(x => x.classList.remove('selected'));
      }
    });
  }

  window.GazetteCanvas = { initCanvasG, drawEdgesG, replayG, mcpBurstG, initInspectorTabs, initActivityDock, initHotkeys };
})();
