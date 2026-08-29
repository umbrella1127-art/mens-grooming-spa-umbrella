import Image from "next/image";

/** 実際の認定証・修了証の画像を添えた資格表示 */
export default function CertificateBadge({
  imageUrl,
  imageAlt,
  label,
  title,
  className = "",
}: {
  imageUrl: string;
  imageAlt: string;
  label?: string;
  title: string;
  className?: string;
}) {
  return (
    <div
      className={`mx-auto flex max-w-xl items-center gap-5 rounded-sm border border-beige bg-paper-dark p-5 ${className}`}
    >
      <Image
        src={imageUrl}
        alt={imageAlt}
        width={90}
        height={127}
        className="h-auto w-[90px] shrink-0 rounded-sm border border-beige object-cover"
      />
      <div>
        {label && (
          <p className="mb-1 text-xs tracking-wider text-brown">{label}</p>
        )}
        <p className="text-sm leading-relaxed text-ink">{title}</p>
      </div>
    </div>
  );
}
