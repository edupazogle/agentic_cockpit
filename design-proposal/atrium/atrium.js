// Atrium — shared interactions
document.addEventListener('DOMContentLoaded', () => {
  // Reveal on scroll
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => e.isIntersecting && e.target.classList.add('in'));
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
});

// Infinite canvas pan/zoom
function initCanvas(panEl, edgesSvg) {
  const stage = panEl.parentElement;
  let scale = 1, tx = 80, ty = 60;
  let isPanning = false, sx = 0, sy = 0, ox = 0, oy = 0;

  const apply = () => {
    panEl.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    if (edgesSvg) edgesSvg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    const readout = document.querySelector('.zb-readout');
    if (readout) readout.textContent = `${Math.round(scale * 100)}%`;
    updateMinimapViewport();
    // also offset background so it appears infinite
    const bg = document.querySelector('.canvas-bg');
    if (bg) bg.style.backgroundPosition = `${tx % (22*scale)}px ${ty % (22*scale)}px`;
  };

  stage.addEventListener('mousedown', (e) => {
    if (e.target.closest('.node, .canvas-toolbar, .canvas-runinfo, .canvas-minimap, .canvas-zoombar, .inspector')) return;
    isPanning = true; sx = e.clientX; sy = e.clientY; ox = tx; oy = ty;
    stage.style.cursor = 'grabbing';
  });
  window.addEventListener('mousemove', (e) => {
    if (!isPanning) return;
    tx = ox + (e.clientX - sx);
    ty = oy + (e.clientY - sy);
    apply();
  });
  window.addEventListener('mouseup', () => { isPanning = false; stage.style.cursor = ''; });

  stage.addEventListener('wheel', (e) => {
    if (e.target.closest('.inspector, .canvas-toolbar, .canvas-runinfo, .canvas-minimap, .canvas-zoombar')) return;
    e.preventDefault();
    const r = stage.getBoundingClientRect();
    const px = e.clientX - r.left, py = e.clientY - r.top;
    const next = Math.min(2, Math.max(0.4, scale - e.deltaY * 0.0015));
    const k = next / scale;
    tx = px - (px - tx) * k; ty = py - (py - ty) * k; scale = next;
    apply();
  }, { passive: false });

  // zoom controls
  document.querySelectorAll('[data-zoom]').forEach(b => b.addEventListener('click', () => {
    const dir = b.dataset.zoom;
    const r = stage.getBoundingClientRect();
    const px = r.width/2, py = r.height/2;
    const next = Math.min(2, Math.max(0.4, dir === 'in' ? scale * 1.2 : dir === 'out' ? scale / 1.2 : 1));
    if (dir === 'fit') { tx = 80; ty = 60; scale = 1; } else {
      const k = next / scale; tx = px - (px - tx) * k; ty = py - (py - ty) * k; scale = next;
    }
    apply();
  }));

  // Minimap viewport tracker
  function updateMinimapViewport() {
    const mmArea = document.querySelector('.mm-area');
    const vp = document.querySelector('.mm-viewport');
    if (!mmArea || !vp) return;
    const aw = mmArea.clientWidth, ah = mmArea.clientHeight;
    const sw = stage.clientWidth, sh = stage.clientHeight;
    const ratio = aw / 1400;
    vp.style.width = `${(sw / scale) * ratio}px`;
    vp.style.height = `${(sh / scale) * ratio}px`;
    vp.style.left = `${(-tx / scale) * ratio}px`;
    vp.style.top = `${(-ty / scale) * ratio}px`;
  }

  apply();
}

// Build edges SVG path
function bezier(x1, y1, x2, y2) {
  const dx = Math.abs(x2 - x1) * 0.5;
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

function drawEdges(edges, svg) {
  svg.innerHTML = '';
  edges.forEach(({ from, to, kind }) => {
    const a = document.querySelector(`#${from}`);
    const b = document.querySelector(`#${to}`);
    if (!a || !b) return;
    const ar = a.getBoundingClientRect();
    const pan = document.querySelector('.canvas-pan');
    const pr = pan.getBoundingClientRect();
    const scale = parseFloat(pan.style.transform.match(/scale\(([^)]+)\)/)?.[1] || '1');
    const ax = (ar.right - pr.left) / scale;
    const ay = (ar.top + ar.height / 2 - pr.top) / scale;
    const br = b.getBoundingClientRect();
    const bx = (br.left - pr.left) / scale;
    const by = (br.top + br.height / 2 - pr.top) / scale;
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', bezier(ax, ay, bx, by));
    path.setAttribute('class', `edge ${kind || ''}`);
    svg.appendChild(path);
  });
}

// Inspector open/close
document.addEventListener('click', (e) => {
  const node = e.target.closest('.node[data-inspect]');
  if (node) {
    document.querySelector('.inspector')?.classList.add('open');
    document.querySelectorAll('.node').forEach(n => n.classList.remove('selected'));
    node.classList.add('selected');
  }
  if (e.target.closest('[data-close-inspector]')) {
    document.querySelector('.inspector')?.classList.remove('open');
  }
});
