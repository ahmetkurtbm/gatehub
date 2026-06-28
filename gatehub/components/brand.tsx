export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand" aria-label="GateHub">
      <span className="brand-mark" aria-hidden="true">
        G
      </span>
      {!compact && <span className="brand-name">GateHub</span>}
    </div>
  );
}
