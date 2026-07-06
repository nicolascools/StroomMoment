export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <section className="card skeleton-card" aria-hidden="true">
      <div className="skeleton skeleton-title" />
      {Array.from({ length: lines }).map((_, index) => (
        <div className="skeleton skeleton-line" key={index} />
      ))}
    </section>
  );
}

// Mirrors the decision hero shape so the answer area does not jump when data lands.
export function HeroSkeleton() {
  return (
    <section className="hero-card hero-skeleton" aria-hidden="true">
      <div className="skeleton dark skeleton-eyebrow" />
      <div className="skeleton dark skeleton-hero-time" />
      <div className="skeleton-chip-row">
        <div className="skeleton dark skeleton-chip" />
        <div className="skeleton dark skeleton-chip" />
      </div>
      <div className="skeleton dark skeleton-line" />
      <div className="skeleton dark skeleton-line" />
    </section>
  );
}
