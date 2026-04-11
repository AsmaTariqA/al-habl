import type { AyahWithResources } from '@/types/quran';

interface AyahDisplayProps {
  ayah: AyahWithResources;
  isLoading?: boolean;
}

export function AyahDisplay({ ayah, isLoading = false }: AyahDisplayProps) {
  if (isLoading) {
    return <div className="glass-card p-8">Loading ayah...</div>;
  }

  return (
    <div className="glass-card space-y-4 p-8">
      <p className="text-sm text-[var(--muted)]">
        Surah {ayah.surah.name} · Ayah {ayah.numberInSurah}
      </p>
      <p className="font-arabic text-right text-3xl leading-loose" dir="rtl">
        {ayah.text}
      </p>
      <p className="text-sm text-[var(--muted)]">{ayah.translations?.[0]?.text}</p>
    </div>
  );
}
