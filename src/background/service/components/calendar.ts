import { StatDay } from '@/shared/day'
import optionHolder from './option-holder'

function getDefaultWeekStart(locale: tt4b.option.LocaleOption): tt4b.WeekStart {
    const jsLocale = locale === 'default' ? chrome.i18n.getUILanguage() : locale.replace('_', '-')
    const val = new Intl.Locale(jsLocale).getWeekInfo?.().firstDay ?? 1
    return val as tt4b.WeekStart
}

export async function getWeekStartDay(): Promise<tt4b.WeekStart> {
    const { weekStart, locale } = await optionHolder.get()
    return weekStart === 'default' ? getDefaultWeekStart(locale) : weekStart
}

export async function getToday(): Promise<StatDay> {
    const { dayStart } = await optionHolder.get()
    return StatDay.today(dayStart)
}