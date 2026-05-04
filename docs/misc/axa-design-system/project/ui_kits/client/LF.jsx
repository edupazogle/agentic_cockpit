/* Look & Feel (B2C Client) — Espace client account area */
window.LFUI = (() => {
  const { useState } = React;

  const SideNav = ({ active, onNav }) => (
    <aside style={{ width: 240, background: "#fff", borderRight: "1px solid #E3E3E3", padding: "24px 0", flexShrink: 0 }}>
      <div style={{ padding: "0 24px 16px", borderBottom: "1px solid #E3E3E3", marginBottom: 12 }}>
        <img src="../../assets/axa_logo.svg" style={{ height: 32 }}/>
      </div>
      {[["dashboard","Tableau de bord"],["description","Mes contrats"],["receipt_long","Mes sinistres"],["payments","Paiements"],["mail","Messagerie"],["settings","Paramètres"]].map(([ic, label]) => (
        <button key={label} onClick={() => onNav(label)} style={{ width: "100%", textAlign: "left", padding: "12px 24px", border: 0, background: active === label ? "#EEEEFF" : "transparent", color: active === label ? "#00008F" : "#333", fontWeight: active === label ? 600 : 400, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, fontSize: 15, fontFamily: "inherit", borderLeft: active === label ? "3px solid #00008F" : "3px solid transparent" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{ic}</span>{label}
        </button>
      ))}
    </aside>
  );

  const TopBar = ({ user }) => (
    <div style={{ height: 64, background: "#fff", borderBottom: "1px solid #E3E3E3", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <h2 style={{ margin: 0, fontFamily: '"Publico", serif', fontWeight: 300, fontSize: 24, color: "#00008F" }}>Bienvenue, {user}</h2>
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <button style={{ background: "none", border: 0, cursor: "pointer", color: "#5C5C5C" }}><span className="material-symbols-outlined">notifications</span></button>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#00008F", color: "#fff", display: "grid", placeItems: "center", fontWeight: 700 }}>{user[0]}</div>
      </div>
    </div>
  );

  const Card = ({ children, style }) => (
    <div style={{ background: "#fff", borderRadius: 12, padding: 20, outline: "1px solid #E3E3E3", outlineOffset: -1, ...style }}>{children}</div>
  );

  const ContractCard = ({ icon, type, name, num, status, onClick }) => (
    <Card style={{ cursor: "pointer", transition: "outline .2s linear" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 32, color: "#00008F" }}>{icon}</span>
        <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 16, background: "#FAFFFB", color: "#0C7D3B", fontWeight: 600 }}>{status}</span>
      </div>
      <div style={{ fontSize: 12, color: "#5C5C5C", textTransform: "uppercase", letterSpacing: ".05em", fontWeight: 600 }}>{type}</div>
      <div style={{ fontSize: 18, fontWeight: 600, color: "#333", margin: "4px 0 8px" }}>{name}</div>
      <div style={{ fontSize: 13, color: "#999", fontFamily: "ui-monospace, monospace" }}>{num}</div>
      <button onClick={onClick} style={{ marginTop: 16, padding: "10px 20px", borderRadius: 8, background: "#fff", color: "#00008F", border: 0, boxShadow: "inset 0 0 0 1px #00008F", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: 14 }}>Voir le détail</button>
    </Card>
  );

  const Dashboard = ({ onClaim }) => (
    <div style={{ padding: 32, background: "#F8F8FF", flex: 1, overflow: "auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        <Card><div style={{ fontSize: 13, color: "#5C5C5C" }}>Contrats actifs</div><div style={{ fontSize: 32, fontWeight: 700, color: "#00008F", fontFamily: '"Publico", serif' }}>4</div></Card>
        <Card><div style={{ fontSize: 13, color: "#5C5C5C" }}>Prochaine échéance</div><div style={{ fontSize: 22, fontWeight: 600, color: "#00008F", marginTop: 6 }}>15 mars 2026</div><div style={{ fontSize: 13, color: "#999" }}>67,40 €</div></Card>
        <Card><div style={{ fontSize: 13, color: "#5C5C5C" }}>Sinistres en cours</div><div style={{ fontSize: 32, fontWeight: 700, color: "#BC4C2D", fontFamily: '"Publico", serif' }}>1</div></Card>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", margin: "0 0 16px" }}>
        <h3 style={{ margin: 0, fontSize: 22, color: "#00008F", fontFamily: '"Publico", serif', fontWeight: 300 }}>Mes contrats</h3>
        <a href="#" style={{ color: "#00008F", fontWeight: 600, fontSize: 14 }}>Voir tous →</a>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
        <ContractCard icon="directions_car" type="Auto" name="Renault Clio" num="N° 87 234 991" status="Actif"/>
        <ContractCard icon="home" type="Habitation" name="3 rue de Rivoli, Paris" num="N° 87 234 992" status="Actif"/>
        <ContractCard icon="favorite" type="Santé" name="Famille — 4 personnes" num="N° 87 234 993" status="Actif"/>
      </div>

      <Card style={{ background: "linear-gradient(135deg, #00008F 0%, #3333A5 100%)", color: "#fff", border: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24 }}>
          <div>
            <h4 style={{ margin: "0 0 6px", fontFamily: '"Publico", serif', fontWeight: 700, fontSize: 22 }}>Un sinistre à déclarer ?</h4>
            <p style={{ margin: 0, color: "#C1C4FF", fontSize: 14 }}>Déclarez votre sinistre en ligne en quelques minutes.</p>
          </div>
          <button onClick={onClaim} style={{ padding: "14px 24px", background: "#fff", color: "#00008F", border: 0, borderRadius: 8, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: 16, flexShrink: 0 }}>Déclarer un sinistre</button>
        </div>
      </Card>
    </div>
  );

  const ClaimModal = ({ onClose }) => {
    const [done, setDone] = useState(false);
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,91,.5)", display: "grid", placeItems: "center", zIndex: 100 }}>
        <div style={{ background: "#fff", borderRadius: 16, width: 520, padding: 32 }}>
          {!done ? (
            <>
              <h3 style={{ margin: "0 0 16px", color: "#00008F", fontFamily: '"Publico", serif', fontWeight: 300 }}>Déclarer un sinistre</h3>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Type de sinistre</label>
              <select style={{ width: "100%", padding: "12px 16px", border: "1px solid #999", borderRadius: 8, marginTop: 6, marginBottom: 14, fontSize: 15, background: "#fff" }}>
                <option>Accident automobile</option><option>Dégât des eaux</option><option>Vol / cambriolage</option>
              </select>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Date du sinistre</label>
              <input defaultValue="01/05/2026" style={{ width: "100%", boxSizing: "border-box", padding: "12px 16px", border: "1px solid #999", borderRadius: 8, marginTop: 6, marginBottom: 14, fontSize: 15 }}/>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Description</label>
              <textarea rows="3" defaultValue="Choc à l'arrière du véhicule sur un parking." style={{ width: "100%", boxSizing: "border-box", padding: "12px 16px", border: "1px solid #999", borderRadius: 8, marginTop: 6, fontSize: 15, fontFamily: "inherit", resize: "vertical" }}/>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 24 }}>
                <button onClick={onClose} style={{ background: "transparent", border: 0, color: "#00008F", fontWeight: 600, cursor: "pointer", fontSize: 15 }}>Annuler</button>
                <button onClick={() => setDone(true)} style={{ padding: "14px 24px", background: "#00008F", color: "#fff", border: 0, borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 15 }}>Envoyer la déclaration</button>
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 64, color: "#0C7D3B" }}>check_circle</span>
              <h3 style={{ margin: "12px 0 8px", color: "#0C7D3B" }}>Déclaration enregistrée</h3>
              <p style={{ color: "#5C5C5C", margin: "0 0 24px" }}>Référence : <strong>SIN-2026-44871</strong>. Un conseiller vous contactera sous 48h.</p>
              <button onClick={onClose} style={{ padding: "14px 24px", background: "#00008F", color: "#fff", border: 0, borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 15 }}>Fermer</button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return { SideNav, TopBar, Card, ContractCard, Dashboard, ClaimModal };
})();
