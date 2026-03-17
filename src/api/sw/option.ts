/**
 * Option domain: request to sw. Variable requestOption for tree-shaking.
 */
import { sendMsg2Runtime } from "@api/chrome/runtime"

const requestOption = <T, R>(code: string, data?: T) =>
    sendMsg2Runtime<T, R>(`option.${code}` as timer.mq.ReqCode, data)

export function getOption() {
    return requestOption<void, timer.option.AllOption>('get')
}

export function setOption(option: Partial<timer.option.AllOption>) {
    return requestOption<Partial<timer.option.AllOption>, void>('set', option)
}

export function isDarkMode(targetVal?: timer.option.AppearanceOption) {
    return requestOption<timer.option.AppearanceOption | undefined, boolean>('isDarkMode', targetVal)
}

export function setDarkMode(mode: timer.option.DarkMode, period?: [number, number]) {
    return requestOption<{ mode: timer.option.DarkMode; period?: [number, number] }, void>('setDarkMode', { mode, period })
}

export function setLocale(locale: timer.option.LocaleOption) {
    return requestOption<timer.option.LocaleOption, void>('setLocale', locale)
}

export function setBackupOption(option: Partial<timer.option.BackupOption>) {
    return requestOption<Partial<timer.option.BackupOption>, void>('setBackupOption', option)
}
