// Studio — pan/zoom + edge drawing
function initCanvasS(stage) {
  let scale = 1, tx = 40, ty = 60;
  let panning = false, lastX = 0, lastY = 0;

  function apply() {
    stage.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    const bg = stage.parentElement.querySelector('.canvas-bg-s');
    if (bg) bg.style.backgroundPosition = `${tx}px ${ty}px`;
    const r = document.querySelector('.zoombar-s .r');
    if (r) r.textContent = Math.round(scale * 100) + '%';
  }

  function onDown(e) {
    if (e.target.closest('.node-s, .toolbar-s, .runinfo-s, .zoombar-s, .minimap-s, .inspector-s')) return;
    panning = true; lastX = e.clientX; lastY = e.clientY;
    stage.parentElement.style.cursor = 'grabbing';
  }
  function onMove(e) { if (!panning) return; tx += e.clientX - lastX; ty += e.clientY - lastY; lastX = e.clientX; lastY = e.clientY; apply(); }
  function onUp() { panning = false; stage.parentElement.style.cursor = ''; }

  function onWheel(e) {
    if (!e.target.closest('.canvas-shell-s')) return;
    e.preventDefault();
    const next = Math.min(2, Math.max(0.4, scale - e.deltaY * 0.0015));
    const rect = stage.parentElement.getBoundingClientRect();
    const px = e.clientX - rect.left, py = e.clientY - rect.top;
    const k = next / scale;
    tx = px - (px - tx) * k; ty = py - (py - ty) * k; scale = next; apply();
  }

  document.querySelectorAll('[data-zs]').forEach(b => b.addEventListener('click', () => {
    const a = b.dataset.zs;
    if (a === 'in') scale = Math.min(2, scale + 0.1);
    else if (a === 'out') scale = Math.max(0.4, scale - 0.1);
    else if (a === 'fit') { scale = 1; tx = 40; ty = 60; }
    apply();
  }));

  stage.parentElement.addEventListener('mousedown', onDown);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
  stage.parentElement.addEventListener('wheel', onWheel, { passive: false });
  apply();
}

function bezierS(x1, y1, x2, y2) {
  const dx = Math.max(60, Math.abs(x2 - x1) * 0.5);
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

function drawEdgesS(edges, svg) {
  if (!svg) return;
  svg.innerHTML = '';
  const stage = document.getElementById('pan-s');
  const stageRect = stage.getBoundingClientRect();
  const m = stage.style.transform.match(/scale\(([\d.]+)\)/);
  const sc = m ? parseFloat(m[1]) : 1;

  edges.forEach(e => {
    const a = document.getElementById(e.from);
    const b = document.getElementById(e.to);
    if (!a || !b) return;
    const ar = a.getBoundingClientRect();
    const br = b.getBoundingClientRect();
    const x1 = (ar.right - stageRect.left) / sc;
    const y1 = (ar.top + ar.height / 2 - stageRect.top) / sc;
    const x2 = (br.left - stageRect.left) / sc;
    const y2 = (br.top + br.height / 2 - stageRect.top) / sc;
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', bezierS(x1, y1, x2, y2));
    path.setAttribute('class', 'edge-s ' + (e.kind || ''));
    svg.appendChild(path);
  });
  svg.style.transform = stage.style.transform;
  svg.style.transformOrigin = '0 0';
}
