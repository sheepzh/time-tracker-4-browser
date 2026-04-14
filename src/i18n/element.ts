import { type Language } from "element-plus/es/locale"
import { locale, t } from "."
import calendarMessages from "./message/common/calendar"

const LOCALES: Record<timer.Locale, () => Promise<{ default: Language }>> = {
    zh_CN: () => import('element-plus/es/locale/lang/zh-cn'),
    zh_TW: () => import('element-plus/es/locale/lang/zh-tw'),
    en: () => import('element-plus/es/locale/lang/en'),
    ja: () => import('element-plus/es/locale/lang/ja'),
    pt_PT: () => import('element-plus/es/locale/lang/pt'),
    uk: () => import('element-plus/es/locale/lang/uk'),
    es: () => import('element-plus/es/locale/lang/es'),
    de: () => import('element-plus/es/locale/lang/de'),
    fr: () => import('element-plus/es/locale/lang/fr'),
    ru: () => import('element-plus/es/locale/lang/ru'),
    ar: () => import('element-plus/es/locale/lang/ar'),
    tr: () => import('element-plus/es/locale/lang/tr'),
    pl: () => import('element-plus/es/locale/lang/pl'),
    it: () => import('element-plus/es/locale/lang/it'),
}

export async function initElementLocale(): Promise<Language> {
    return (await LOCALES[locale]()).default
}

export const dateFormat = () => t(calendarMessages, { key: msg => msg.dateFormat, param: { y: 'YYYY', m: 'MM', d: 'DD' } })
