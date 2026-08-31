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
      className={`mx-auto flex max-w-xl flex-col items-center gap-5 rounded-sm border border-beige bg-paper-dark p-6 text-center sm:flex-row sm:text-left ${className}`}
    >
      <Image
        src={imageUrl}
        alt={imageAlt}
        width={160}
        height={226}
        className="h-auto w-[160px] shrink-0 rounded-sm border border-beige object-cover sm:w-[180px]"
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
