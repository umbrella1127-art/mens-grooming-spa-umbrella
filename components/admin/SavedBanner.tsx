export default function SavedBanner({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <p className="mb-6 rounded bg-green-50 px-4 py-3 text-sm text-green-800">
      保存しました。数秒でサイトに反映されます。
    </p>
  );
}
