export function SkeletonPilotCard() {
  return (
    <div className="pilot-card skeleton" role="status" aria-label="Loading pilot">
      <div className="pc-head">
        <span className="sk-line" style={{ width: "40%" }} />
        <span className="sk-line" style={{ width: "20%" }} />
      </div>
      <div className="sk-line" style={{ width: "70%", height: "20px", marginTop: "8px" }} />
      <div className="sk-line" style={{ width: "50%", marginTop: "12px" }} />
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="skeleton-table" role="status" aria-label="Loading table">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="sk-row">
          <span className="sk-line" style={{ width: "15%" }} />
          <span className="sk-line" style={{ width: "20%" }} />
          <span className="sk-line" style={{ width: "35%" }} />
          <span className="sk-line" style={{ width: "10%" }} />
          <span className="sk-line" style={{ width: "15%" }} />
        </div>
      ))}
    </div>
  );
}
