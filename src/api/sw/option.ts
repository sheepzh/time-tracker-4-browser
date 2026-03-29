/**
 * Option domain: request to sw.
 */
import { sendMsg2Runtime } from "@api/sw/common"

export function getOption() {
    return sendMsg2Runtime('option.get')
}

export async function tryGetOption(): Promise<timer.option.AllOption | null> {
    try {
        return await sendMsg2Runtime('option.get')
    } catch {
        return await Promise.resolve(null)
    }
}

export function setOption(option: Partial<timer.option.AllOption>) {
    return sendMsg2Runtime('option.set', option)
}

export function setDarkMode(mode: timer.option.DarkMode, period?: [number, number]) {
    const payload: Pick<timer.option.AppearanceOption, 'darkMode' | 'darkModeTimeStart' | 'darkModeTimeEnd'> = {
        darkMode: mode,
    }
    if (period) {
        payload.darkModeTimeStart = period[0]
        payload.darkModeTimeEnd = period[1]
    }
    return sendMsg2Runtime('option.setDarkMode', payload)
}

export function setLocale(locale: timer.option.LocaleOption) {
    return sendMsg2Runtime('option.setLocale', locale)
}

export function setBackupOption(option: Partial<timer.option.BackupOption>) {
    return sendMsg2Runtime('option.setBackupOption', option)
}

export async function getWeekBounds(now?: number | Date): Promise<[Date, Date]> {
    let ts = typeof now === 'number' ? now : now?.getTime()
    ts = ts ?? Date.now()
    const { start, end } = await sendMsg2Runtime('option.getWeekBounds', ts)
    return [new Date(start), new Date(end)]
}

export function getWeekStartDay() {
    return sendMsg2Runtime('option.getWeekStartDay')
}
