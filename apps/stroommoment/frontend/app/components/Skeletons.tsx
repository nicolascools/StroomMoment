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

export function SkeletonPlanner() {
  return (
    <div className="grid two" aria-hidden="true">
      <SkeletonCard lines={5} />
      <SkeletonCard lines={5} />
    </div>
  );
}
