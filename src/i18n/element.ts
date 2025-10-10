import ElementPlus from 'element-plus'
import { type Language } from "element-plus/lib/locale"
import { type App } from "vue"
import { locale, t } from "."
import calendarMessages from "./message/common/calendar"

const LOCALES: { [locale in timer.Locale]: () => Promise<{ default: Language }> } = {
    zh_CN: () => import('element-plus/lib/locale/lang/zh-cn'),
    zh_TW: () => import('element-plus/lib/locale/lang/zh-tw'),
    en: () => import('element-plus/lib/locale/lang/en'),
    ja: () => import('element-plus/lib/locale/lang/ja'),
    pt_PT: () => import('element-plus/lib/locale/lang/pt'),
    uk: () => import('element-plus/lib/locale/lang/uk'),
    es: () => import('element-plus/lib/locale/lang/es'),
    de: () => import('element-plus/lib/locale/lang/de'),
    fr: () => import('element-plus/lib/locale/lang/fr'),
    ru: () => import('element-plus/lib/locale/lang/ru'),
    ar: () => import('element-plus/lib/locale/lang/ar'),
}

export const initElementLocale = async (app: App) => {
    const module = await LOCALES[locale]?.()
    const EL_LOCALE = module?.default
    app.use(ElementPlus, { locale: EL_LOCALE })
}

export const dateFormat = () => t(calendarMessages, { key: msg => msg.dateFormat, param: { y: 'YYYY', m: 'MM', d: 'DD' } })
