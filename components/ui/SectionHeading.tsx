export default function SectionHeading({
  en,
  children,
  align = "center",
  tone = "dark",
}: {
  en?: string;
  children: React.ReactNode;
  align?: "center" | "left";
  tone?: "dark" | "light";
}) {
  const alignClass = align === "center" ? "text-center" : "text-left";
  return (
    <div className={`${alignClass} mb-10 md:mb-14`}>
      {en && (
        <p
          className={`text-xs tracking-[0.3em] uppercase mb-3 ${
            tone === "dark" ? "text-brown" : "text-beige"
          }`}
        >
          {en}
        </p>
      )}
      <h2
        className={`text-2xl md:text-3xl ${
          tone === "dark" ? "text-ink" : "text-paper"
        }`}
      >
        {children}
      </h2>
    </div>
  );
}
