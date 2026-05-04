/* Slash (B2B Distributeur) — agent/broker workspace */
window.SlashUI = (() => {
  const { useState } = React;

  const TopBar = () => (
    <div style={{ height: 56, background: "#00008F", color: "#fff", display: "flex", alignItems: "center", padding: "0 20px", gap: 24 }}>
      <img src="../../assets/axa_logo.svg" style={{ height: 28, filter: "brightness(0) invert(1)" }}/>
      <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, color: "#C1C4FF" }}>SLASH · Espace Distributeur</span>
      <div style={{ flex: 1 }}/>
      <input placeholder="Rechercher un client, contrat, sinistre…" style={{ width: 320, padding: "6px 12px", border: 0, fontSize: 13, fontFamily: "inherit" }}/>
      <span style={{ fontSize: 13 }}>P. Martin · Cabinet 7741</span>
    </div>
  );

  const Tabs = ({ active, onChange }) => (
    <div style={{ background: "#fff", borderBottom: "1px solid #999", padding: "0 20px", display: "flex", gap: 0 }}>
      {["Portefeuille", "Production", "Sinistres", "Encaissements", "Outils"].map(t => (
        <button key={t} onClick={() => onChange(t)} style={{ padding: "12px 20px", border: 0, background: "transparent", color: active === t ? "#00008F" : "#5C5C5C", fontWeight: active === t ? 700 : 400, cursor: "pointer", fontSize: 14, fontFamily: "inherit", borderBottom: active === t ? "3px solid #00008F" : "3px solid transparent", marginBottom: -1 }}>
          {t}
        </button>
      ))}
    </div>
  );

  const Kpi = ({ label, value, delta, color = "#00008F" }) => (
    <div style={{ background: "#fff", padding: 14, boxShadow: "0 0 9px 0 rgba(0,0,0,.18)", flex: 1 }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".05em", color: "#5C5C5C", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      {delta && <div style={{ fontSize: 12, color: delta.startsWith("+") ? "#0C7D3B" : "#C7102E", marginTop: 2 }}>{delta} vs mois précédent</div>}
    </div>
  );

  const Table = ({ rows, onOpen }) => (
    <div style={{ background: "#fff", boxShadow: "0 0 9px 0 rgba(0,0,0,.18)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#F2F2F2", textAlign: "left" }}>
            {["N° contrat", "Client", "Produit", "Prime annuelle", "Échéance", "Statut", ""].map(h => (
              <th key={h} style={{ padding: "10px 12px", fontWeight: 700, color: "#333", borderBottom: "1px solid #999", fontSize: 12, textTransform: "uppercase", letterSpacing: ".03em" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.n} style={{ background: i % 2 ? "#FAFAFA" : "#fff", borderBottom: "1px solid #E3E3E3" }}>
              <td style={{ padding: "12px", fontFamily: "ui-monospace, monospace", color: "#00008F" }}>{r.n}</td>
              <td style={{ padding: "12px" }}>{r.client}</td>
              <td style={{ padding: "12px", color: "#5C5C5C" }}>{r.product}</td>
              <td style={{ padding: "12px", fontVariantNumeric: "tabular-nums", textAlign: "right" }}>{r.prime}</td>
              <td style={{ padding: "12px", color: "#5C5C5C" }}>{r.due}</td>
              <td style={{ padding: "12px" }}>
                <span style={{ padding: "2px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700, background: r.status === "Actif" ? "#FAFFFB" : r.status === "Impayé" ? "#FFFAFB" : "#FFF1EF", color: r.status === "Actif" ? "#0C7D3B" : r.status === "Impayé" ? "#C7102E" : "#BC4C2D" }}>{r.status}</span>
              </td>
              <td style={{ padding: "12px", textAlign: "right" }}>
                <button onClick={() => onOpen(r)} style={{ background: "transparent", color: "#00008F", border: 0, fontWeight: 700, cursor: "pointer", textDecoration: "underline", fontSize: 13 }}>Ouvrir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const Detail = ({ row, onClose }) => (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,91,.5)", display: "grid", placeItems: "center", zIndex: 100 }}>
      <div style={{ background: "#fff", width: 560, padding: 0, boxShadow: "0 24px 60px rgba(0,0,91,.3)" }}>
        <div style={{ background: "#00008F", color: "#fff", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, color: "#C1C4FF", fontFamily: "ui-monospace, monospace" }}>CONTRAT {row.n}</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{row.client}</div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: 0, color: "#fff", fontSize: 22, cursor: "pointer" }}>×</button>
        </div>
        <div style={{ padding: 20 }}>
          {[["Produit", row.product], ["Prime annuelle", row.prime], ["Date d'échéance", row.due], ["Statut", row.status], ["Cabinet", "7741 — P. Martin"]].map(([k, v]) => (
            <div key={k} style={{ display: "grid", gridTemplateColumns: "180px 1fr", padding: "10px 0", borderBottom: "1px solid #E3E3E3", fontSize: 13 }}>
              <div style={{ color: "#5C5C5C", fontWeight: 600 }}>{k}</div>
              <div>{v}</div>
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
            <button style={{ padding: "10px 16px", background: "#00008F", color: "#fff", border: 0, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: 14, boxShadow: "inset 0 -2px #00005B" }}>Modifier</button>
            <button style={{ padding: "10px 16px", background: "#fff", color: "#00008F", border: "1px solid #00008F", borderBottom: 0, boxShadow: "inset 0 -2px #00008F", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: 14 }}>Avenant</button>
            <button style={{ padding: "10px 16px", background: "#C7102E", color: "#fff", border: 0, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: 14, boxShadow: "inset 0 -2px #6D0915", marginLeft: "auto" }}>Résilier</button>
          </div>
        </div>
      </div>
    </div>
  );

  const Workspace = () => {
    const [tab, setTab] = useState("Portefeuille");
    const [open, setOpen] = useState(null);
    const rows = [
      { n: "87234991", client: "DUPONT Marie", product: "Auto · Tous risques", prime: "478,40 €", due: "15/03/2026", status: "Actif" },
      { n: "87234992", client: "DURAND Pierre", product: "Habitation", prime: "312,00 €", due: "01/04/2026", status: "Actif" },
      { n: "87234993", client: "MARTIN SAS", product: "Multirisque pro", prime: "1 840,50 €", due: "12/05/2026", status: "À renouveler" },
      { n: "87234994", client: "LEROY Sophie", product: "Santé famille", prime: "2 156,00 €", due: "08/02/2026", status: "Impayé" },
      { n: "87234995", client: "BERNARD & Co", product: "Flotte automobile", prime: "8 720,00 €", due: "30/06/2026", status: "Actif" },
    ];
    return (
      <div data-screen-label="Slash Workspace" style={{ minHeight: "100vh", background: "#F2F2F2" }}>
        <TopBar/>
        <Tabs active={tab} onChange={setTab}/>
        <div style={{ padding: 20 }}>
          <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
            <Kpi label="Portefeuille" value="1 247" delta="+18"/>
            <Kpi label="Primes encaissées (M)" value="284 K€" delta="+4,2 %" color="#0C7D3B"/>
            <Kpi label="Sinistres ouverts" value="23" delta="-3" color="#BC4C2D"/>
            <Kpi label="Renouvellements (30j)" value="47" color="#00008F"/>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 16, color: "#333", fontWeight: 700 }}>Contrats récents</h3>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ padding: "8px 14px", background: "#fff", color: "#00008F", border: "1px solid #00008F", borderBottom: 0, boxShadow: "inset 0 -2px #00008F", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>Exporter</button>
              <button style={{ padding: "8px 14px", background: "#00008F", color: "#fff", border: 0, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: 13, boxShadow: "inset 0 -2px #00005B" }}>+ Nouveau contrat</button>
            </div>
          </div>
          <Table rows={rows} onOpen={setOpen}/>
        </div>
        {open && <Detail row={open} onClose={() => setOpen(null)}/>}
      </div>
    );
  };

  return { TopBar, Tabs, Kpi, Table, Detail, Workspace };
})();
