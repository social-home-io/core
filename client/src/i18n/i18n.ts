import { signal } from '@preact/signals'
import en from './locales/en.json'

type Translations = Record<string, string>

/** Source-of-truth English catalog. Frozen so missing translations
 *  in the active locale gracefully fall back to the English string
 *  rather than a raw dotted key — §30 fallback semantics. */
const EN_SOURCE: Translations = en

const translations = signal<Translations>(en)
export const locale = signal('en')

export function t(key: string, params?: Record<string, string>): string {
  // Fallback chain: active locale → English source → raw key.
  // Raw-key fallback is the dev-time "missing translation" signal;
  // in production, `EN_SOURCE[key]` covers every key we ship so end
  // users never see a dotted key.
  let text = translations.value[key] || EN_SOURCE[key] || key
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, v)
    }
  }
  return text
}

export async function setLocale(lang: string) {
  try {
    const mod = await import(`./locales/${lang}.json`)
    translations.value = mod.default
    locale.value = lang
  } catch {
    console.warn(`Locale ${lang} not found, falling back to en`)
  }
}
