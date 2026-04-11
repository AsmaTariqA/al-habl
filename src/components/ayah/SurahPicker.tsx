'use client';

import { useEffect, useState } from 'react';
import { getAllSurahs } from '@/lib/qf-api';
import { Surah } from '@/types/quran';
import { SlideInUp } from '@/components/animations/TextReveal';

interface SurahPickerProps {
  onSelect: (surah: Surah) => void;
  loading?: boolean;
}

export function SurahPicker({ onSelect, loading = false }: SurahPickerProps) {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSurahs = async () => {
      try {
        setIsLoading(true);
        const data = await getAllSurahs();
        setSurahs(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load surahs');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSurahs();
  }, []);

  const filtered = surahs.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.nameArabic.includes(search) ||
      s.number.toString().includes(search)
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-2 border-[var(--gold-border)] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[var(--muted)]">Loading Surahs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-900/10 border border-red-500/30 rounded-lg text-red-300">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <SlideInUp delay={0}>
        <input
          type="text"
          placeholder="Search surah by name or number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 bg-[var(--glass-strong)] border border-[var(--glass-border)] rounded-xl text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--gold-border)] focus:outline-none transition"
        />
      </SlideInUp>

      {/* Surahs Grid */}
      <SlideInUp delay={100} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-8 text-[var(--muted)]">
            No surahs found
          </div>
        ) : (
          filtered.map((surah, idx) => (
            <button
              key={surah.number}
              onClick={() => onSelect(surah)}
              disabled={loading}
              className="glass-card p-4 text-left hover:border-[var(--gold-border)] disabled:opacity-50 stagger-item opacity-0"
              style={{ animationDelay: `${150 + idx * 30}ms` }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[var(--gold)]">
                      #{surah.number}
                    </span>
                    <span className="text-xs px-2 py-1 badge">
                      {surah.revelationType}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--text)]">
                    {surah.name}
                  </h3>
                  <p className="arabic text-sm text-[var(--gold)]">
                    {surah.nameArabic}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {surah.numberOfAyahs} verses
                  </p>
                </div>
              </div>
            </button>
          ))
        )}
      </SlideInUp>
    </div>
  );
}
