import type { AyahWithResources } from '@/types/quran';

interface AyahDisplayProps {
  ayah: AyahWithResources;
  isLoading?: boolean;
}

export function AyahDisplay({ ayah, isLoading = false }: AyahDisplayProps) {
  if (isLoading) {
    return (
      <div className="glass-card" style={{ padding: '2rem' }}>
        <div className="skeleton" style={{ height: '1.5rem', width: '40%', marginBottom: '1rem' }} />
        <div className="skeleton" style={{ height: '3rem', marginBottom: '1rem' }} />
        <div className="skeleton" style={{ height: '1rem', width: '80%' }} />
        <div className="skeleton" style={{ height: '1rem', width: '65%', marginTop: '0.5rem' }} />
      </div>
    );
  }

  return (
    <div
      className="glass-card gold-line-top"
      style={{ padding: '1.75rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
    >
      {/* Reference */}
      <p
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.7rem',
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: '16px',
            height: '1px',
            background: 'var(--muted)',
            opacity: 0.5,
          }}
        />
        Surah {ayah.surah.name} · Ayah {ayah.numberInSurah}
      </p>

      {/* Divider */}
      <div className="divider-gold" />

      {/* Arabic */}
      <p
        dir="rtl"
        style={{
          fontFamily: 'var(--font-arabic)',
          fontSize: 'clamp(1.6rem, 4vw, 2.1rem)',
          lineHeight: 2.1,
          textAlign: 'right',
          color: 'var(--text)',
        }}
      >
        {ayah.text}
      </p>

      {/* Divider */}
      <div className="divider" />

      {/* Translation */}
      {ayah.translations?.[0]?.text && (
        <p
          style={{
            fontSize: '0.9375rem',
            lineHeight: 1.8,
            color: 'var(--text-soft)',
            fontStyle: 'italic',
          }}
        >
          &ldquo;{ayah.translations[0].text}&rdquo;
        </p>
      )}
    </div>
  );
}