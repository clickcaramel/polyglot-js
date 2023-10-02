export const languages = [
  'af', 'sq', 'am', 'ar', 'hy', 'as', 'ay', 'az', 'bm', 'eu', 'be', 'bn',
  'bho', 'bs', 'bg', 'ca', 'ceb', 'zh', 'zh-Hans', 'zh-Hant', 'zh-HK', 'co', 'hr', 'cs', 'da', 'dv', 'doi', 'nl',
  'en', 'eo', 'et', 'ee', 'fil', 'fi', 'fr', 'fy', 'gl', 'ka', 'de', 'el', 'gn', 'gu', 'ht', 'ha',
  'haw', 'he', 'hi', 'hmn', 'hu', 'is', 'ig', 'ilo', 'id', 'ga', 'it', 'ja', 'jv', 'kn', 'kk', 'km',
  'rw', 'gom', 'ko', 'kri', 'ku', 'ckb', 'ky', 'lo', 'la', 'lv', 'ln', 'lt', 'lg', 'lb', 'mk', 'mai',
  'mg', 'ms', 'ml', 'mt', 'mi', 'mr', 'mni-Mtei', 'lus', 'mn', 'my', 'ne', 'no', 'ny', 'or', 'om',
  'ps', 'fa', 'pl', 'pt', 'pa', 'qu', 'ro', 'ru', 'sm', 'sa', 'gd', 'nso', 'sr', 'st', 'sn', 'sd', 'si',
  'sk', 'sl', 'so', 'es', 'su', 'sw', 'sv', 'tl', 'tg', 'ta', 'tt', 'te', 'th', 'ti', 'ts', 'tr', 'tk',
  'ak', 'uk', 'ur', 'ug', 'uz', 'vi', 'cy', 'xh', 'yi', 'yo', 'zu', 'en-GB', 'en-US', 'pt-BR', 'pt-PT'
] as const;

export type Language = typeof languages[number];

export interface Translation {
  language: Language,
  translation: string,
  manual: boolean,
  lastChangeDate?: number,
  description?: string,
  desiredMaxLength?: number,
  translatorComment?: string,
  numberOfApprovals?: number,
  fullStringId?: string,
}

interface PublicTranslation {
  value: string,
  translatorComment?: string,
}

type PublicTranslationsMap = Partial<Record<Language, PublicTranslation>>;

export interface Localisation {
  description?: string;
  desiredMaxLength?: number;
  translations: PublicTranslationsMap;
  stringId: string,
}
