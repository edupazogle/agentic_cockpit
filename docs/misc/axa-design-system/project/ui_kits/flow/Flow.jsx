/* AXA Flow — workflow canvas built on the AXA Canopée design language.
   Visual DNA: Railway / n8n nodes. Brand DNA: AXA blue, Source Sans, Publico for hero, 12-px card radius. */
window.FlowKit = (() => {
  const { useState, useRef, useEffect, useCallback, useMemo } = React;

  /* ---------- node taxonomy ---------- */
  const CATEGORIES = {
    trigger: { label: "Déclencheur", color: "#0C7D3B", bg: "#FAFFFB", icon: "bolt" },
    data:    { label: "Données",     color: "#3871B5", bg: "#F5FBFD", icon: "database" },
    agent:   { label: "Agent IA",    color: "#5A3976", bg: "#F7F2FB", icon: "smart_toy" },
    logic:   { label: "Logique",     color: "#00008F", bg: "#F8F8FF", icon: "alt_route" },
    action:  { label: "Action AXA",  color: "#BC4C2D", bg: "#FFF1EF", icon: "rocket_launch" },
    output:  { label: "Sortie",      color: "#333",    bg: "#F6F6F6", icon: "outbox" },
  };

  const NODE_LIBRARY = [
    { id: "t-claim",   cat: "trigger", title: "Sinistre déclaré",  sub: "Webhook Espace Client",     ins: 0, outs: 1 },
    { id: "t-form",    cat: "trigger", title: "Formulaire devis",  sub: "axa.fr · Apollo",            ins: 0, outs: 1 },
    { id: "t-cron",    cat: "trigger", title: "Planifié",          sub: "Cron · 6 h chaque jour",     ins: 0, outs: 1 },

    { id: "d-policy",  cat: "data",    title: "Lookup contrat",    sub: "Core Insurance API",         ins: 1, outs: 1 },
    { id: "d-customer",cat: "data",    title: "Profil client",     sub: "CRM Salesforce",             ins: 1, outs: 1 },
    { id: "d-vector",  cat: "data",    title: "Knowledge Base",    sub: "Pinecone · CGV index",       ins: 1, outs: 1 },

    { id: "a-triage",  cat: "agent",   title: "Triage sinistre",   sub: "Claude · classifier",         ins: 1, outs: 2 },
    { id: "a-extract", cat: "agent",   title: "Extraction docs",   sub: "OCR + Claude vision",         ins: 1, outs: 1 },
    { id: "a-quote",   cat: "agent",   title: "Calcul tarif",      sub: "Modèle pricing v3.2",        ins: 1, outs: 1 },

    { id: "l-if",      cat: "logic",   title: "Condition",         sub: "Si montant > 5 000 €",       ins: 1, outs: 2 },
    { id: "l-merge",   cat: "logic",   title: "Fusion",            sub: "Combiner branches",          ins: 2, outs: 1 },

    { id: "x-pay",     cat: "action",  title: "Indemnisation",     sub: "Virement SEPA",              ins: 1, outs: 1 },
    { id: "x-mail",    cat: "action",  title: "E-mail client",     sub: "Template Espace Client",     ins: 1, outs: 1 },
    { id: "x-task",    cat: "action",  title: "Créer tâche Slash", sub: "Distributeur · cabinet",     ins: 1, outs: 1 },

    { id: "o-end",     cat: "output",  title: "Fin de flux",       sub: "Logguer & archiver",         ins: 1, outs: 0 },
  ];

  /* ---------- demo workflow ---------- */
  const DEMO = {
    nodes: [
      { id: "n1", lib: "t-claim",   x:  60,  y: 240 },
      { id: "n2", lib: "d-policy",  x: 320,  y: 240 },
      { id: "n3", lib: "a-extract", x: 580,  y: 100 },
      { id: "n4", lib: "a-triage",  x: 580,  y: 360 },
      { id: "n5", lib: "l-if",      x: 860,  y: 360 },
      { id: "n6", lib: "x-pay",     x: 1140, y: 260 },
      { id: "n7", lib: "x-task",    x: 1140, y: 460 },
      { id: "n8", lib: "x-mail",    x: 1420, y: 360 },
      { id: "n9", lib: "o-end",     x: 1700, y: 360 },
    ],
    edges: [
      { id: "e1", from: "n1", fo: 0, to: "n2", ti: 0 },
      { id: "e2", from: "n2", fo: 0, to: "n3", ti: 0 },
      { id: "e3", from: "n2", fo: 0, to: "n4", ti: 0 },
      { id: "e4", from: "n4", fo: 0, to: "n5", ti: 0, label: "valid" },
      { id: "e5", from: "n5", fo: 0, to: "n6", ti: 0, label: "auto" },
      { id: "e6", from: "n5", fo: 1, to: "n7", ti: 0, label: "manuel" },
      { id: "e7", from: "n6", fo: 0, to: "n8", ti: 0 },
      { id: "e8", from: "n7", fo: 0, to: "n8", ti: 0 },
      { id: "e9", from: "n8", fo: 0, to: "n9", ti: 0 },
    ],
  };

  /* ---------- geometry ---------- */
  const NODE_W = 232;
  const NODE_HEAD = 56;
  const PORT_GAP = 22;
  const nodeHeight = (n) => {
    const lib = NODE_LIBRARY.find(l => l.id === n.lib);
    const ports = Math.max(lib.ins, lib.outs, 1);
    return NODE_HEAD + ports * PORT_GAP + 16;
  };
  const portY = (n, side, idx) => {
    const lib = NODE_LIBRARY.find(l => l.id === n.lib);
    const total = side === "in" ? lib.ins : lib.outs;
    const startY = NODE_HEAD + 14;
    return startY + idx * PORT_GAP + (total <= 1 ? 0 : 0);
  };

  /* ---------- bezier path ---------- */
  const bezier = (x1, y1, x2, y2) => {
    const dx = Math.max(60, Math.abs(x2 - x1) * 0.45);
    return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
  };

  /* ---------- node component ---------- */
  const Node = ({ node, lib, cat, selected, running, onMouseDown, onPortDown, onClick }) => {
    const h = nodeHeight(node);
    return (
      <div
        onMouseDown={onMouseDown}
        onClick={onClick}
        style={{
          position: "absolute",
          left: node.x, top: node.y,
          width: NODE_W, height: h,
          background: "#fff",
          borderRadius: 12,
          boxShadow: selected
            ? `0 0 0 2px ${cat.color}, 0 8px 24px -4px rgba(0,0,128,.18)`
            : "0 0 0 1px #E3E3E3, 0 2px 8px -2px rgba(0,0,128,.08)",
          cursor: "grab",
          fontFamily: "'Source Sans 3', sans-serif",
          userSelect: "none",
          transition: "box-shadow .15s linear",
        }}>
        {/* header */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "12px 14px",
          borderBottom: "1px solid #F2F2F2",
          background: cat.bg,
          borderRadius: "12px 12px 0 0",
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: cat.color,
            color: "#fff",
            display: "grid", placeItems: "center",
            flexShrink: 0,
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{lib.icon || cat.icon}</span>
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 700, color: cat.color }}>{cat.label}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#333", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{lib.title}</div>
          </div>
          {running && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#0C7D3B", boxShadow: "0 0 0 4px #0C7D3B33", animation: "pulse 1.4s ease-in-out infinite" }}/>}
        </div>
        {/* body */}
        <div style={{ padding: "10px 14px", fontSize: 12, color: "#5C5C5C", lineHeight: 1.4 }}>
          {lib.sub}
        </div>
        {/* input ports */}
        {Array.from({ length: lib.ins }).map((_, i) => (
          <div key={`in-${i}`}
            onMouseDown={(e) => { e.stopPropagation(); onPortDown(node.id, "in", i, e); }}
            style={{
              position: "absolute",
              left: -7, top: portY(node, "in", i),
              width: 14, height: 14, borderRadius: "50%",
              background: "#fff",
              border: `2px solid ${cat.color}`,
              cursor: "crosshair",
              transition: "transform .1s",
            }}/>
        ))}
        {/* output ports */}
        {Array.from({ length: lib.outs }).map((_, i) => (
          <div key={`out-${i}`}
            onMouseDown={(e) => { e.stopPropagation(); onPortDown(node.id, "out", i, e); }}
            style={{
              position: "absolute",
              right: -7, top: portY(node, "out", i),
              width: 14, height: 14, borderRadius: "50%",
              background: cat.color,
              border: "2px solid #fff",
              boxShadow: `0 0 0 1px ${cat.color}`,
              cursor: "crosshair",
            }}/>
        ))}
      </div>
    );
  };

  /* ---------- the canvas ---------- */
  const Canvas = () => {
    const [nodes, setNodes] = useState(DEMO.nodes);
    const [edges, setEdges] = useState(DEMO.edges);
    const [selected, setSelected] = useState("n4");
    const [running, setRunning] = useState(null);
    const [view, setView] = useState({ x: 40, y: 60, k: 0.85 });
    const [paletteOpen, setPaletteOpen] = useState(true);

    const dragRef = useRef(null);   // node drag
    const panRef = useRef(null);    // canvas pan
    const wireRef = useRef(null);   // wire creation
    const [wire, setWire] = useState(null);
    const wrapRef = useRef(null);

    const findNode = (id) => nodes.find(n => n.id === id);

    /* world coords from screen */
    const screenToWorld = (sx, sy) => {
      const rect = wrapRef.current.getBoundingClientRect();
      return {
        x: (sx - rect.left - view.x) / view.k,
        y: (sy - rect.top - view.y) / view.k,
      };
    };

    /* ---------- pan ---------- */
    const onCanvasMouseDown = (e) => {
      if (e.target.closest("[data-node]") || e.target.closest("[data-port]")) return;
      panRef.current = { sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y };
      setSelected(null);
    };

    /* ---------- zoom ---------- */
    const onWheel = (e) => {
      e.preventDefault();
      const rect = wrapRef.current.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      const delta = -e.deltaY * 0.0015;
      const k = Math.max(0.3, Math.min(1.6, view.k * (1 + delta)));
      const ratio = k / view.k;
      setView({
        x: mx - (mx - view.x) * ratio,
        y: my - (my - view.y) * ratio,
        k,
      });
    };

    /* ---------- node drag ---------- */
    const onNodeDown = (id) => (e) => {
      if (e.target.dataset && e.target.dataset.port) return;
      e.stopPropagation();
      setSelected(id);
      const n = findNode(id);
      dragRef.current = { id, sx: e.clientX, sy: e.clientY, ox: n.x, oy: n.y };
    };

    /* ---------- port → wire ---------- */
    const onPortDown = (nodeId, side, idx, e) => {
      e.stopPropagation();
      const n = findNode(nodeId);
      if (side !== "out") return; // only drag from outputs for simplicity
      const start = { x: n.x + NODE_W, y: n.y + portY(n, "out", idx) + 7 };
      const w = screenToWorld(e.clientX, e.clientY);
      wireRef.current = { from: nodeId, fo: idx, sx: start.x, sy: start.y };
      setWire({ x1: start.x, y1: start.y, x2: w.x, y2: w.y });
    };

    /* ---------- mouse move/up ---------- */
    useEffect(() => {
      const move = (e) => {
        if (panRef.current) {
          const p = panRef.current;
          setView(v => ({ ...v, x: p.vx + (e.clientX - p.sx), y: p.vy + (e.clientY - p.sy) }));
        }
        if (dragRef.current) {
          const d = dragRef.current;
          const dx = (e.clientX - d.sx) / view.k;
          const dy = (e.clientY - d.sy) / view.k;
          setNodes(ns => ns.map(n => n.id === d.id ? { ...n, x: d.ox + dx, y: d.oy + dy } : n));
        }
        if (wireRef.current) {
          const w = screenToWorld(e.clientX, e.clientY);
          setWire(s => s && { ...s, x2: w.x, y2: w.y });
        }
      };
      const up = (e) => {
        // wire drop
        if (wireRef.current) {
          const t = e.target.closest("[data-port]");
          if (t && t.dataset.side === "in") {
            const newEdge = {
              id: "e" + Date.now(),
              from: wireRef.current.from,
              fo: wireRef.current.fo,
              to: t.dataset.node,
              ti: parseInt(t.dataset.idx, 10),
            };
            setEdges(es => [...es, newEdge]);
          }
          wireRef.current = null;
          setWire(null);
        }
        panRef.current = null;
        dragRef.current = null;
      };
      window.addEventListener("mousemove", move);
      window.addEventListener("mouseup", up);
      return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    }, [view.k]);

    /* ---------- run animation ---------- */
    const runFlow = useCallback(() => {
      const order = ["n1", "n2", "n3", "n4", "n5", "n6", "n8", "n9"];
      let i = 0;
      const tick = () => {
        if (i >= order.length) { setRunning(null); return; }
        setRunning(order[i]);
        i++;
        setTimeout(tick, 600);
      };
      tick();
    }, []);

    /* ---------- add node from palette ---------- */
    const addNode = (libId) => {
      const id = "n" + Date.now();
      const center = screenToWorld(window.innerWidth / 2, window.innerHeight / 2);
      setNodes(ns => [...ns, { id, lib: libId, x: center.x - NODE_W / 2, y: center.y - 50 }]);
      setSelected(id);
    };

    /* ---------- selected node info ---------- */
    const selNode = selected ? findNode(selected) : null;
    const selLib = selNode ? NODE_LIBRARY.find(l => l.id === selNode.lib) : null;
    const selCat = selLib ? CATEGORIES[selLib.cat] : null;

    /* ---------- render edges ---------- */
    const renderEdges = () => edges.map(e => {
      const a = findNode(e.from), b = findNode(e.to);
      if (!a || !b) return null;
      const aLib = NODE_LIBRARY.find(l => l.id === a.lib);
      const bLib = NODE_LIBRARY.find(l => l.id === b.lib);
      const aCat = CATEGORIES[aLib.cat];
      const x1 = a.x + NODE_W;
      const y1 = a.y + portY(a, "out", e.fo) + 7;
      const x2 = b.x;
      const y2 = b.y + portY(b, "in", e.ti) + 7;
      const isRunning = running && (running === e.from || running === e.to);
      return (
        <g key={e.id}>
          <path d={bezier(x1, y1, x2, y2)} stroke={aCat.color} strokeWidth={1.5} fill="none" opacity={isRunning ? 1 : 0.55}/>
          {isRunning && <path d={bezier(x1, y1, x2, y2)} stroke={aCat.color} strokeWidth={2.5} fill="none" strokeDasharray="6 6" className="dash"/>}
          {e.label && (() => {
            const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
            return (
              <g transform={`translate(${mx}, ${my})`}>
                <rect x={-26} y={-10} width={52} height={20} rx={10} fill="#fff" stroke="#E3E3E3"/>
                <text textAnchor="middle" dy="4" fontSize="11" fontFamily="'Source Sans 3', sans-serif" fill="#5C5C5C" fontWeight="600">{e.label}</text>
              </g>
            );
          })()}
        </g>
      );
    });

    return (
      <div style={{ position: "fixed", inset: 0, fontFamily: "'Source Sans 3', sans-serif", background: "#FAFAFB" }}>

        {/* TOP BAR */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 56, background: "#fff", borderBottom: "1px solid #E3E3E3", display: "flex", alignItems: "center", padding: "0 16px", gap: 16, zIndex: 10 }}>
          <img src="../../assets/axa_logo.svg" style={{ height: 28 }}/>
          <div style={{ width: 1, height: 24, background: "#E3E3E3" }}/>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#5C5C5C" }}>
            <span>Atelier Flux</span>
            <span style={{ color: "#CCC" }}>/</span>
            <span style={{ color: "#333", fontWeight: 600 }}>Sinistre auto · auto-indemnisation</span>
            <span style={{ background: "#FAFFFB", color: "#0C7D3B", padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700, marginLeft: 6 }}>v 3 · publié</span>
          </div>
          <div style={{ flex: 1 }}/>
          <button onClick={runFlow} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 100, border: 0, background: "#00008F", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>play_arrow</span>Exécuter
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 100, border: 0, background: "#fff", color: "#00008F", boxShadow: "inset 0 0 0 1px #00008F", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>save</span>Enregistrer
          </button>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#00008F", color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 13 }}>PM</div>
        </div>

        {/* PALETTE (left) */}
        {paletteOpen && (
          <div style={{ position: "absolute", top: 56, bottom: 0, left: 0, width: 280, background: "#fff", borderRight: "1px solid #E3E3E3", overflowY: "auto", zIndex: 5 }}>
            <div style={{ padding: "16px 16px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 700, color: "#00008F" }}>Bibliothèque</div>
                <div style={{ fontFamily: '"Publico", serif', fontWeight: 300, fontSize: 22, color: "#00008F", marginTop: 2 }}>Briques de flux</div>
              </div>
              <button onClick={() => setPaletteOpen(false)} style={{ background: "transparent", border: 0, color: "#5C5C5C", cursor: "pointer" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>chevron_left</span>
              </button>
            </div>
            <div style={{ padding: "0 16px 16px" }}>
              <div style={{ position: "relative" }}>
                <span className="material-symbols-outlined" style={{ position: "absolute", left: 10, top: 9, fontSize: 18, color: "#999" }}>search</span>
                <input placeholder="Rechercher une brique…" style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px 9px 34px", fontSize: 13, border: "1px solid #E3E3E3", borderRadius: 8, fontFamily: "inherit", background: "#FAFAFB" }}/>
              </div>
            </div>
            {Object.entries(CATEGORIES).map(([key, cat]) => (
              <div key={key} style={{ padding: "0 16px 12px" }}>
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 700, color: cat.color, marginBottom: 6 }}>{cat.label}</div>
                {NODE_LIBRARY.filter(l => l.cat === key).map(l => (
                  <button key={l.id} onClick={() => addNode(l.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      width: "100%", padding: "8px 10px",
                      background: "#fff", border: "1px solid #F2F2F2", borderRadius: 8,
                      marginBottom: 6, cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                      transition: "all .12s linear",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = cat.bg; e.currentTarget.style.borderColor = cat.color + "55"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#F2F2F2"; }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: cat.color, color: "#fff", display: "grid", placeItems: "center", flexShrink: 0 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{l.icon || cat.icon}</span>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>{l.title}</div>
                      <div style={{ fontSize: 11, color: "#999", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.sub}</div>
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
        {!paletteOpen && (
          <button onClick={() => setPaletteOpen(true)} style={{ position: "absolute", top: 72, left: 12, zIndex: 5, width: 32, height: 32, borderRadius: 8, border: "1px solid #E3E3E3", background: "#fff", cursor: "pointer", color: "#00008F" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_right</span>
          </button>
        )}

        {/* CANVAS */}
        <div ref={wrapRef}
          onMouseDown={onCanvasMouseDown}
          onWheel={onWheel}
          style={{
            position: "absolute", top: 56, bottom: 0,
            left: paletteOpen ? 280 : 0, right: selNode ? 320 : 0,
            background: "#FAFAFB",
            backgroundImage: `radial-gradient(circle at 1px 1px, #00008F18 1px, transparent 0)`,
            backgroundSize: `${24 * view.k}px ${24 * view.k}px`,
            backgroundPosition: `${view.x}px ${view.y}px`,
            overflow: "hidden",
            cursor: panRef.current ? "grabbing" : "grab",
          }}>

          <div style={{
            position: "absolute", inset: 0,
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})`,
            transformOrigin: "0 0",
          }}>
            {/* edges layer */}
            <svg style={{ position: "absolute", overflow: "visible", pointerEvents: "none", top: 0, left: 0, width: 1, height: 1 }}>
              {renderEdges()}
              {wire && <path d={bezier(wire.x1, wire.y1, wire.x2, wire.y2)} stroke="#00008F" strokeWidth={2} strokeDasharray="6 6" fill="none" opacity={0.7}/>}
            </svg>
            {/* nodes */}
            {nodes.map(n => {
              const lib = NODE_LIBRARY.find(l => l.id === n.lib);
              const cat = CATEGORIES[lib.cat];
              return (
                <div key={n.id} data-node>
                  <Node node={n} lib={lib} cat={cat}
                    selected={selected === n.id}
                    running={running === n.id}
                    onMouseDown={onNodeDown(n.id)}
                    onClick={(e) => { e.stopPropagation(); setSelected(n.id); }}
                    onPortDown={onPortDown}/>
                  {/* hidden hit-targets for input ports for wire-drop */}
                  {Array.from({ length: lib.ins }).map((_, i) => (
                    <div key={`hit-${i}`} data-port data-side="in" data-node={n.id} data-idx={i}
                      style={{
                        position: "absolute",
                        left: n.x - 12, top: n.y + portY(n, "in", i) - 5,
                        width: 24, height: 24, borderRadius: "50%",
                        background: "transparent",
                      }}/>
                  ))}
                </div>
              );
            })}
          </div>

          {/* zoom controls */}
          <div style={{ position: "absolute", bottom: 16, right: 16, display: "flex", flexDirection: "column", background: "#fff", borderRadius: 8, boxShadow: "0 0 0 1px #E3E3E3, 0 4px 12px -4px rgba(0,0,128,.12)", overflow: "hidden", zIndex: 4 }}>
            <button onClick={() => setView(v => ({ ...v, k: Math.min(1.6, v.k * 1.15) }))} style={zoomBtn}><span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span></button>
            <div style={{ padding: "4px 0", textAlign: "center", fontSize: 11, fontFamily: "ui-monospace, monospace", color: "#5C5C5C", borderTop: "1px solid #F2F2F2", borderBottom: "1px solid #F2F2F2" }}>{Math.round(view.k * 100)}%</div>
            <button onClick={() => setView(v => ({ ...v, k: Math.max(0.3, v.k / 1.15) }))} style={zoomBtn}><span className="material-symbols-outlined" style={{ fontSize: 16 }}>remove</span></button>
            <button onClick={() => setView({ x: 40, y: 60, k: 0.85 })} style={{ ...zoomBtn, borderTop: "1px solid #F2F2F2" }}><span className="material-symbols-outlined" style={{ fontSize: 16 }}>fit_screen</span></button>
          </div>

          {/* mini-legend */}
          <div style={{ position: "absolute", bottom: 16, left: 16, display: "flex", gap: 6, background: "#fff", padding: "8px 12px", borderRadius: 100, boxShadow: "0 0 0 1px #E3E3E3", fontSize: 11, color: "#5C5C5C", zIndex: 4 }}>
            {Object.entries(CATEGORIES).map(([k, c]) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 4, padding: "0 4px" }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: c.color }}/>
                <span>{c.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* INSPECTOR (right) */}
        {selNode && (
          <div style={{ position: "absolute", top: 56, right: 0, bottom: 0, width: 320, background: "#fff", borderLeft: "1px solid #E3E3E3", overflowY: "auto", zIndex: 5 }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #F2F2F2" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 700, color: selCat.color }}>{selCat.label}</div>
                <button onClick={() => setSelected(null)} style={{ background: "transparent", border: 0, cursor: "pointer", color: "#5C5C5C" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
                </button>
              </div>
              <div style={{ fontFamily: '"Publico", serif', fontWeight: 300, fontSize: 24, color: "#00008F", marginTop: 6 }}>{selLib.title}</div>
              <div style={{ fontSize: 13, color: "#5C5C5C", marginTop: 4 }}>{selLib.sub}</div>
            </div>

            <div style={{ padding: "16px 20px", borderBottom: "1px solid #F2F2F2" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#333", marginBottom: 10 }}>Configuration</div>
              <Field label="Nom interne" value={selLib.title.toLowerCase().replace(/\s/g, "_")}/>
              <Field label="Mode d'exécution" value="Synchrone"/>
              <Field label="Timeout" value="30 s"/>
              {selLib.cat === "agent" && (
                <>
                  <Field label="Modèle" value="claude-haiku-4-5"/>
                  <Field label="Température" value="0.2"/>
                </>
              )}
              {selLib.cat === "logic" && selLib.id === "l-if" && (
                <Field label="Expression" value="{{ trigger.amount }} > 5000" mono/>
              )}
            </div>

            <div style={{ padding: "16px 20px", borderBottom: "1px solid #F2F2F2" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#333", marginBottom: 10 }}>Dernière exécution</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#0C7D3B", marginBottom: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span>
                <span>Réussie · 4 mai 2026, 14:22</span>
              </div>
              <div style={{ fontSize: 12, color: "#5C5C5C" }}>Durée : <strong style={{ color: "#333" }}>1,2 s</strong> · Coût : <strong style={{ color: "#333" }}>0,003 €</strong></div>
            </div>

            <div style={{ padding: "16px 20px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#333", marginBottom: 10 }}>Sortie (preview)</div>
              <pre style={{ margin: 0, padding: 12, background: "#F8F8FF", borderRadius: 8, fontSize: 11, fontFamily: "ui-monospace, monospace", color: "#00008F", lineHeight: 1.5, overflow: "auto", maxHeight: 200 }}>
{`{
  "claim_id": "SIN-2026-44871",
  "category": "auto.collision",
  "severity": "low",
  "amount_estimate": 1840.50,
  "auto_pay_eligible": true
}`}
              </pre>
            </div>
          </div>
        )}

        <style>{`
          @keyframes pulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.4); opacity: .5; } }
          @keyframes dashdraw { 0% { stroke-dashoffset: 12; } 100% { stroke-dashoffset: 0; } }
          .dash { animation: dashdraw .5s linear infinite; }
        `}</style>
      </div>
    );
  };

  const zoomBtn = { background: "#fff", border: 0, padding: "6px 8px", cursor: "pointer", color: "#00008F", display: "grid", placeItems: "center", fontFamily: "inherit" };

  const Field = ({ label, value, mono }) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11, color: "#999", marginBottom: 3, fontWeight: 600 }}>{label}</div>
      <div style={{ padding: "8px 10px", background: "#FAFAFB", border: "1px solid #E3E3E3", borderRadius: 6, fontSize: 13, color: "#333", fontFamily: mono ? "ui-monospace, monospace" : "inherit" }}>{value}</div>
    </div>
  );

  return { Canvas };
})();
