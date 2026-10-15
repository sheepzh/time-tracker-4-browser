import optionHolder from './option-holder'

/**
 * @returns 1-7
 */
function getDefaultWeekStart(locale: tt4b.option.LocaleOption): number {
    const jsLocale = locale === 'default' ? chrome.i18n.getUILanguage() : locale.replace('_', '-')
    return new Intl.Locale(jsLocale).getWeekInfo?.().firstDay ?? 1
}

/**
 * Week start
 *
 * @returns 0-6
 */
export async function getWeekStartDay(): Promise<number> {
    const { weekStart, locale } = await optionHolder.get()
    return (weekStart === 'default' ? getDefaultWeekStart(locale) : weekStart) - 1
}
