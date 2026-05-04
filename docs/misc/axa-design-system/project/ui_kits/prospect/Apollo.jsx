/* Apollo (B2C Prospect) — axa.fr-style marketing kit */
window.ApolloUI = (() => {
  const { useState } = React;

  const Header = () => (
    <header style={{ background: "#fff", borderBottom: "1px solid #E3E3E3", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
        <img src="../../assets/axa_logo.svg" alt="AXA" style={{ height: 36 }}/>
        <nav style={{ display: "flex", gap: 24, fontSize: 15, fontWeight: 600 }}>
          {["Particuliers", "Pros & Entreprises", "Banque", "Recrutement"].map(t => (
            <a key={t} href="#" style={{ color: "#333", textDecoration: "none" }}>{t}</a>
          ))}
        </nav>
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <a href="#" style={{ color: "#00008F", fontSize: 14, fontWeight: 600 }}>Trouver une agence</a>
        <button className="apollo-btn apollo-btn--secondary">Espace client</button>
      </div>
    </header>
  );

  const Hero = ({ onQuote }) => (
    <section style={{ position: "relative", height: 460, backgroundImage: "linear-gradient(90deg, rgba(0,0,143,.85) 0%, rgba(0,0,143,.55) 60%, rgba(0,0,143,.2) 100%), url(../../assets/hero-prospect.jpg)", backgroundSize: "cover", backgroundPosition: "center", color: "#fff", display: "flex", alignItems: "center", padding: "0 64px" }}>
      <div style={{ maxWidth: 580 }}>
        <div className="apollo-eyebrow" style={{ color: "#C1C4FF" }}>Assurance auto</div>
        <h1 style={{ fontFamily: '"Publico Headline", serif', fontSize: 56, lineHeight: "64px", fontWeight: 700, margin: "12px 0 16px" }}>Roulez l'esprit tranquille.</h1>
        <p style={{ fontSize: 20, lineHeight: 1.5, margin: "0 0 28px", color: "#E4E4FF", fontFamily: '"Publico", serif', fontWeight: 300 }}>Devis en 3 minutes, sans engagement. Une formule pensée pour votre quotidien.</p>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="apollo-btn" onClick={onQuote}>Demander un devis</button>
          <button className="apollo-btn apollo-btn--inverse">En savoir plus</button>
        </div>
      </div>
    </section>
  );

  const ProductCard = ({ icon, title, desc, tag }) => (
    <div className="apollo-card">
      {tag && <span className="apollo-tag">{tag}</span>}
      <span className="material-symbols-outlined" style={{ color: "#00008F", fontSize: 36 }}>{icon}</span>
      <h4 style={{ margin: "12px 0 6px", color: "#00008F", fontWeight: 600, fontSize: 20 }}>{title}</h4>
      <p style={{ margin: "0 0 16px", color: "#5C5C5C", fontSize: 14, lineHeight: 1.5 }}>{desc}</p>
      <a href="#" style={{ color: "#00008F", fontWeight: 600, fontSize: 14, textDecoration: "underline" }}>Découvrir →</a>
    </div>
  );

  const ProductGrid = () => (
    <section style={{ padding: "64px", background: "#F8F8FF" }}>
      <div className="apollo-eyebrow">Nos protections</div>
      <h2 style={{ fontFamily: '"Publico", serif', fontWeight: 300, fontSize: 40, color: "#00008F", margin: "8px 0 32px" }}>Une assurance pour chaque moment de vie.</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
        <ProductCard icon="directions_car" title="Auto" desc="Tous risques, tiers, jeune conducteur." tag="Populaire"/>
        <ProductCard icon="home" title="Habitation" desc="Locataire, propriétaire, étudiant."/>
        <ProductCard icon="favorite" title="Santé" desc="Mutuelle, hospitalisation, optique."/>
        <ProductCard icon="savings" title="Épargne" desc="Assurance vie, PER, livrets."/>
      </div>
    </section>
  );

  const QuoteFlow = ({ onClose }) => {
    const [step, setStep] = useState(0);
    const steps = ["Vous", "Votre véhicule", "Votre profil", "Devis"];
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,91,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
        <div style={{ background: "#fff", borderRadius: 16, width: 560, padding: 32, boxShadow: "0 24px 60px rgba(0,0,91,.3)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <h3 style={{ margin: 0, color: "#00008F", fontFamily: '"Publico", serif', fontWeight: 300, fontSize: 28 }}>Demander un devis</h3>
            <button onClick={onClose} style={{ background: "none", border: 0, cursor: "pointer", fontSize: 24, color: "#5C5C5C" }}>×</button>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            {steps.map((s, i) => (
              <div key={s} style={{ flex: 1, height: 4, background: i <= step ? "#00008F" : "#E3E3E3", borderRadius: 2 }}/>
            ))}
          </div>
          <div style={{ fontSize: 13, color: "#5C5C5C", marginBottom: 16 }}>Étape {step + 1} / {steps.length} · {steps[step]}</div>
          {step < 3 ? (
            <>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Code postal</label>
              <input type="text" defaultValue="75008" style={{ width: "100%", boxSizing: "border-box", padding: "12px 16px", border: "1px solid #999", borderRadius: 8, fontSize: 16, marginBottom: 16 }}/>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{step === 0 ? "Date de naissance" : step === 1 ? "Marque" : "Profession"}</label>
              <input type="text" defaultValue={step === 0 ? "12/04/1985" : step === 1 ? "Renault Clio" : "Cadre"} style={{ width: "100%", boxSizing: "border-box", padding: "12px 16px", border: "1px solid #999", borderRadius: 8, fontSize: 16 }}/>
            </>
          ) : (
            <div style={{ background: "#FAFFFB", padding: 24, borderRadius: 12, textAlign: "center" }}>
              <span className="material-symbols-outlined" style={{ color: "#0C7D3B", fontSize: 48 }}>check_circle</span>
              <h4 style={{ margin: "8px 0", color: "#0C7D3B" }}>Votre devis : 38,90 € / mois</h4>
              <p style={{ margin: 0, fontSize: 14, color: "#5C5C5C" }}>Formule Tous Risques · franchise 300 €</p>
            </div>
          )}
          <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
            {step > 0 && <button className="apollo-btn apollo-btn--secondary" onClick={() => setStep(step - 1)}>Retour</button>}
            <button className="apollo-btn" onClick={() => step < 3 ? setStep(step + 1) : onClose()}>{step < 3 ? "Continuer" : "Souscrire"}</button>
          </div>
        </div>
      </div>
    );
  };

  const Footer = () => (
    <footer style={{ background: "#00008F", color: "#fff", padding: "48px 64px 24px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32, marginBottom: 32 }}>
        {[["Particuliers", ["Auto", "Habitation", "Santé", "Épargne"]], ["Pros", ["Multirisque pro", "Santé TNS", "Prévoyance"]], ["AXA", ["À propos", "Recrutement", "Engagements"]], ["Aide", ["Contact", "Mentions légales", "Cookies"]]].map(([h, items]) => (
          <div key={h}>
            <h6 style={{ fontFamily: '"Publico", serif', fontWeight: 700, fontSize: 16, margin: "0 0 12px" }}>{h}</h6>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              {items.map(i => <li key={i}><a href="#" style={{ color: "#C1C4FF", textDecoration: "none", fontSize: 14 }}>{i}</a></li>)}
            </ul>
          </div>
        ))}
      </div>
      <div style={{ borderTop: "1px solid #5959B6", paddingTop: 16, fontSize: 12, color: "#C1C4FF" }}>© AXA France 2026 · Mentions légales · Données personnelles</div>
    </footer>
  );

  return { Header, Hero, ProductGrid, QuoteFlow, Footer };
})();
