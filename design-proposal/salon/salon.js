// SALON — pan/zoom + ink-flow edges + slow replay choreography + sparkle MCP burst
// Same API surface as gazette.js, different timing & particle styling.

(function () {
  const NS = 'http://www.w3.org/2000/svg';

  function transformOf(el) {
    const m = el.style.transform.match(/translate\(([\-\d.]+)px,\s*([\-\d.]+)px\)\s*scale\(([\d.]+)\)/);
    return m ? { tx: +m[1], ty: +m[2], s: +m[3] } : { tx: 0, ty: 0, s: 1 };
  }

  function initCanvasS(stage) {
    let scale = 1, tx = 60, ty = 110;
    let panning = false, lastX = 0, lastY = 0;

    function apply() {
      stage.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
      const r = document.querySelector('.zoombar-s .r');
      if (r) r.textContent = Math.round(scale * 100) + '%';
      const svg = document.getElementById('edges-s');
      if (svg) { svg.style.transform = stage.style.transform; svg.style.transformOrigin = '0 0'; }
    }

    stage.parentElement.addEventListener('mousedown', (e) => {
      if (e.target.closest('.node-s, .toolbar-s, .runinfo-s, .zoombar-s, .minimap-s, .inspector-s, .activity-s, .hitl-banner-s')) return;
      panning = true; lastX = e.clientX; lastY = e.clientY;
      stage.parentElement.style.cursor = 'grabbing';
    });
    window.addEventListener('mousemove', (e) => { if (!panning) return; tx += e.clientX - lastX; ty += e.clientY - lastY; lastX = e.clientX; lastY = e.clientY; apply(); });
    window.addEventListener('mouseup', () => { panning = false; stage.parentElement.style.cursor = ''; });
    stage.parentElement.addEventListener('wheel', (e) => {
      if (!e.target.closest('.canvas-shell-s')) return;
      e.preventDefault();
      const next = Math.min(2, Math.max(0.4, scale - e.deltaY * 0.0015));
      const rect = stage.parentElement.getBoundingClientRect();
      const px = e.clientX - rect.left, py = e.clientY - rect.top;
      const k = next / scale;
      tx = px - (px - tx) * k; ty = py - (py - ty) * k; scale = next;
      apply();
    }, { passive: false });

    document.querySelectorAll('[data-zs]').forEach(b => b.addEventListener('click', () => {
      const a = b.dataset.zs;
      if (a === 'in') scale = Math.min(2, scale + 0.1);
      else if (a === 'out') scale = Math.max(0.4, scale - 0.1);
      else if (a === 'fit') { scale = 1; tx = 60; ty = 110; }
      apply();
    }));
    apply();
  }

  function bezierS(x1, y1, x2, y2) {
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

  function drawEdgesS(edges, svg, stageEl) {
    if (!svg) return;
    svg.innerHTML = '';
    edges.forEach((e, i) => {
      const a = document.getElementById(e.from);
      const b = document.getElementById(e.to);
      if (!a || !b) return;
      const p = getEdgePoints(a, b, stageEl);
      const path = document.createElementNS(NS, 'path');
      path.setAttribute('d', bezierS(p.x1, p.y1, p.x2, p.y2));
      path.setAttribute('class', 'edge-s ' + (e.kind || ''));
      path.setAttribute('id', 'es-' + i);
      svg.appendChild(path);
    });
  }

  async function replayS(edges) {
    const stage = document.getElementById('pan-s');
    const svg = document.getElementById('edges-s');
    if (!stage || !svg) return;
    stage.querySelectorAll('.node-s').forEach(n => n.classList.remove('ignite', 'mcp-active'));
    if (!edges.length) return;

    const ignite = (id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.remove('ignite');
      void el.offsetWidth;
      el.classList.add('ignite');
    };
    const wait = ms => new Promise(r => setTimeout(r, ms));

    ignite(edges[0].from);
    await wait(600);

    for (let i = 0; i < edges.length; i++) {
      const e = edges[i];
      const a = document.getElementById(e.from);
      const b = document.getElementById(e.to);
      if (!a || !b) continue;
      const p = getEdgePoints(a, b, stage);
      const d = bezierS(p.x1, p.y1, p.x2, p.y2);

      const overlay = document.createElementNS(NS, 'path');
      overlay.setAttribute('d', d);
      overlay.setAttribute('class', 'edge-s replay');
      svg.appendChild(overlay);

      const particle = document.createElementNS(NS, 'circle');
      particle.setAttribute('r', '5');
      particle.setAttribute('class', 'edge-particle-s');
      particle.setAttribute('cx', p.x1);
      particle.setAttribute('cy', p.y1);
      const anim = document.createElementNS(NS, 'animateMotion');
      anim.setAttribute('dur', '1100ms');
      anim.setAttribute('repeatCount', '1');
      anim.setAttribute('fill', 'freeze');
      anim.setAttribute('path', d);
      particle.appendChild(anim);
      svg.appendChild(particle);
      anim.beginElement();

      await wait(1050);
      particle.remove();
      ignite(e.to);

      if (e.mcp) {
        const node = document.getElementById(e.to);
        if (node) {
          node.classList.add('mcp-active');
          await wait(1200);
          node.classList.remove('mcp-active');
        }
      } else {
        await wait(280);
      }
    }
  }

  function mcpBurstS(nodeId, durationMs = 1800) {
    const el = document.getElementById(nodeId);
    if (!el) return;
    el.classList.add('mcp-active');
    setTimeout(() => el.classList.remove('mcp-active'), durationMs);
  }

  function initInspectorTabsS() {
    document.querySelectorAll('.insp-tabs-s .tab').forEach(t => {
      t.addEventListener('click', () => {
        t.parentElement.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
        t.classList.add('active');
        const target = t.dataset.target;
        document.querySelectorAll('.insp-pane-s').forEach(p => p.classList.toggle('active', p.dataset.pane === target));
      });
    });
    document.querySelectorAll('.op-opt-s').forEach(o => o.addEventListener('click', () => {
      document.querySelectorAll('.op-opt-s').forEach(x => x.classList.remove('selected'));
      o.classList.add('selected');
    }));
    document.querySelectorAll('.node-s').forEach(n => {
      n.addEventListener('click', () => {
        document.querySelectorAll('.node-s').forEach(x => x.classList.remove('selected'));
        n.classList.add('selected');
        document.querySelector('.inspector-s')?.classList.add('open');
      });
    });
    document.querySelectorAll('.insp-head-s .close').forEach(b => b.addEventListener('click', () => {
      document.querySelector('.inspector-s')?.classList.remove('open');
      document.querySelectorAll('.node-s').forEach(x => x.classList.remove('selected'));
    }));
  }

  function initActivityDockS() {
    const dock = document.querySelector('.activity-s');
    if (!dock) return;
    dock.querySelector('.head')?.addEventListener('click', (e) => {
      if (e.target.closest('.filter-chip')) return;
      if (dock.classList.contains('tall')) dock.classList.remove('tall');
      else if (dock.classList.contains('open')) dock.classList.add('tall');
      else dock.classList.add('open');
    });
    dock.querySelectorAll('.filter-chip').forEach(c => c.addEventListener('click', () => c.classList.toggle('on')));
  }

  function initHotkeysS() {
    window.addEventListener('keydown', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      const map = { '1': 0, '2': 1, '3': 2 };
      if (e.key in map) {
        const opts = document.querySelectorAll('.op-opt-s');
        if (opts[map[e.key]]) opts[map[e.key]].click();
      }
      if (e.key === 'r' || e.key === 'R') document.querySelector('.replay-btn-s')?.click();
      if (e.key === 'Escape') {
        document.querySelector('.inspector-s')?.classList.remove('open');
        document.querySelectorAll('.node-s').forEach(x => x.classList.remove('selected'));
      }
    });
  }

  window.SalonCanvas = { initCanvasS, drawEdgesS, replayS, mcpBurstS, initInspectorTabsS, initActivityDockS, initHotkeysS };
})();
