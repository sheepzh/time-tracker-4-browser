import { sendMsg2Runtime } from "./common"

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
    return sendMsg2Runtime('option.setDarkMode', { mode, period })
}

export function setLocale(locale: timer.option.LocaleOption) {
    return sendMsg2Runtime('option.setLocale', locale)
}

export function setBackupOption(option: Partial<timer.option.BackupOption>) {
    return sendMsg2Runtime('option.setBackupOption', option)
}