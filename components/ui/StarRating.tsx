export default function StarRating({
  rating = 5,
  className = "",
}: {
  rating?: number;
  className?: string;
}) {
  return (
    <div
      className={`flex justify-center gap-0.5 ${className}`}
      role="img"
      aria-label={`評価 5段階中${rating}`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          className={`h-4 w-4 ${i < rating ? "fill-brown" : "fill-beige"}`}
          aria-hidden="true"
        >
          <path d="M10 1.5l2.6 5.5 6 .6-4.5 4 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.5-4 6-.6z" />
        </svg>
      ))}
    </div>
  );
}
