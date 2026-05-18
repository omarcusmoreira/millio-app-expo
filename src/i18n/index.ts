import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import ptBR from './locales/pt-BR.json';
import enUS from './locales/en-US.json';

export type SupportedLocale = 'pt-BR' | 'en-US';

// pt-BR is the product default. Locale switching is an explicit user action
// stored in the household (see domain/entities.ts Locale type).
const fallbackLocale: SupportedLocale = 'pt-BR';

i18n.use(initReactI18next).init({
  resources: {
    'pt-BR': { translation: ptBR },
    'en-US': { translation: enUS },
  },
  lng: fallbackLocale,
  fallbackLng: fallbackLocale,
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: 'v4',
});

export default i18n;
