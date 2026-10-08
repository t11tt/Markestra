export function PageAurora({ className = "" }: { className?: string }) {
  return (
    <div className={`page-aurora grain ${className}`} aria-hidden>
      <span className="orb orb-base" />
      <span className="orb orb-a" />
      <span className="orb orb-b" />
      <span className="orb orb-c" />
      <span className="orb orb-d" />
    </div>
  );
}
