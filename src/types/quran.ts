export interface Surah {
  id: number;
  number: number;
  name: string;
  nameArabic: string;
  revelationType: 'Meccan' | 'Medinan';
  numberOfAyahs: number;
}

export interface Ayah {
  number: number;
  numberInSurah: number;
  juz: number;
  manzil: number;
  page: number;
  ruku: number;
  hizbQuarter: number;
  sajdah: boolean;
  text: string;
  surah: Surah;
}

export interface AyahWithResources extends Ayah {
  translations?: {
    id: number;
    name: string;
    languageName: string;
    text: string;
  }[];
  tafsirs?: {
    id: number;
    name: string;
    languageName: string;
    text: string;
  }[];
  recitations?: {
    id: number;
    reciterName: string;
    moshafName: string;
    url: string;
  }[];
  words?: {
    position: number;
    text: string;
    translation: string;
  }[];
}
