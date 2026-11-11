/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { isVNode, type VNode } from 'vue'
import { getUILanguage } from "../api/chrome/i18n"
import { getOption } from '../api/sw/option'
import { setDir, setLocale } from "../util/document"
import { ALL_LOCALES as _ALL_LOCALES } from "./message/merge"

/**
 * Not to import this one if not necessary
 */
export type FakedLocale = tt4b.Locale

/**
 * @since 0.2.2
 */
const FEEDBACK_LOCALE: tt4b.Locale = "en"

export const ALL_LOCALES: tt4b.Locale[] = _ALL_LOCALES

// Standardize the locale code according to the Chrome locale code
const chrome2I18n: { [key: string]: tt4b.Locale } = {
    'zh': 'zh_CN',
    'zh-CN': "zh_CN",
    'zh-TW': "zh_TW",
    'en': 'en',
    'en-US': "en",
    'en-GB': "en",
    'ja': "ja",
    'pt': 'pt_PT',
    'pt-PT': 'pt_PT',
    'pt-BR': 'pt_PT',
    'de': 'de',
    'fr': 'fr',
    'fr-CA': 'fr',
    'fr-CH': 'fr',
    'ar': 'ar',
    'ru': 'ru',
    'tr': 'tr',
    'pl': 'pl',
}

const translationChrome2I18n: { [key: string]: tt4b.TranslatingLocale } = {
    ko: 'ko',
    it: 'it',
    sv: 'sv',
    fi: 'fi',
    da: 'da',
    hr: 'hr',
    id: 'id',
    cs: 'cs',
    ro: 'ro',
    nl: 'nl',
    vi: 'vi',
    sk: 'sk',
    mn: 'mn',
}

/**
 * Codes returned by getUILanguage() are defined by Chrome browser
 * @see https://github.com/unicode-cldr/cldr-localenames-modern/blob/master/main/en/languages.json
 * But supported locale codes in Chrome extension
 * @see https://developer.chrome.com/docs/extensions/reference/i18n#locales
 *
 * They are different, so translate
 */
function chromeLocale2ExtensionLocale(chromeLocale: string): tt4b.Locale {
    if (!chromeLocale) return FEEDBACK_LOCALE
    const code2 = chromeLocale.substring(0, 2)
    return chrome2I18n[chromeLocale] ?? chrome2I18n[code2] ?? FEEDBACK_LOCALE
}

const browserUiLocale: tt4b.Locale = chromeLocale2ExtensionLocale(getUILanguage())

/**
 * @since 0.9.0
 */
export const localeSameAsBrowser: tt4b.Locale = browserUiLocale

/**
 * @since 1.5.0
 */
export function isTranslatingLocale(): boolean {
    const uiLang = getUILanguage()
    if (chrome2I18n[uiLang]) {
        return false
    }
    return !!translationChrome2I18n[uiLang]
}

/**
 * Real locale with locale option
 */
export let locale: tt4b.Locale = browserUiLocale

export function cvtOption2Locale(option: tt4b.option.LocaleOption): tt4b.Locale {
    if (!option || option === 'default') {
        return chromeLocale2ExtensionLocale(getUILanguage())
    }
    return option
}

export function handleLocaleOption(option: tt4b.option.LocaleOption) {
    locale = cvtOption2Locale(option)

    setLocale(locale)
    setDir(locale === 'ar' ? 'rtl' : 'ltr')
}

/**
 * Please invoke this function before doing anything
 * @since 0.8.0
 */
export async function initLocale(option?: tt4b.option.AppearanceOption) {
    option ??= await getOption()
    handleLocaleOption(option.locale)
}

function tryGetOriginalI18nVal<MessageType>(
    messages: Messages<MessageType>,
    keyPath: I18nKey<MessageType>,
    specLocale?: tt4b.Locale
) {
    try {
        return keyPath(messages[specLocale || locale] as MessageType)
    } catch (ignore) {
        return undefined
    }
}

function getI18nVal<MessageType>(
    messages: Messages<MessageType>,
    keyPath: I18nKey<MessageType>,
    specLocale?: tt4b.Locale
): string {
    const result = tryGetOriginalI18nVal(messages, keyPath, specLocale)
        || keyPath(messages[FEEDBACK_LOCALE] as MessageType)
        || ''
    return typeof result === 'string' ? result : JSON.stringify(result)
}

export type TParam = Record<string, string | number | undefined | null>
type TranslateProps<MessageType> = {
    key: I18nKey<MessageType>
    param?: TParam
}

function fillWithParam(result: string, param: TParam) {
    if (!result) return result
    Object.entries(param)
        .filter(([_key, value]) => value !== null && value !== undefined)
        .forEach(([key, value]) => result = result.replace(`{${key}}`, (value ?? '').toString()))
    return result
}

export function t<MessageType>(messages: Messages<MessageType>, props: TranslateProps<MessageType>, specLocale?: tt4b.Locale): string {
    const { key, param } = props
    const result: string = getI18nVal(messages, key, specLocale)
    return param ? fillWithParam(result, param) : result
}

export type I18nKey<MessageType> = (messages: MessageType) => string | undefined

export type I18nResultItem = VNode | string

const findParamAndReplace = (resultArr: I18nResultItem[], [key, value]: [string, I18nResultItem]) => {
    const paramPlacement = `{${key}}`
    const temp: I18nResultItem[] = []
    resultArr.forEach((item) => {
        if (typeof item === 'string' && item.includes(paramPlacement)) {
            let splits: I18nResultItem[] = item.split(paramPlacement)
            splits = splits.reduce<I18nResultItem[]>((left, right) => left.length ? left.concat(value, right) : left.concat(right), [])
            temp.push(...splits)
        } else {
            temp.push(item)
        }
    })
    return temp
}

export type TnParam = Record<string, I18nResultItem> | VNode

export type NodeTranslateProps<MessageType> = {
    key: I18nKey<MessageType>,
    param?: TnParam
}

/**
 * Translate with slots for vue
 */
export const tN = <MessageType>(messages: Messages<MessageType>, props: NodeTranslateProps<MessageType>): I18nResultItem[] | I18nResultItem => {
    const result = getI18nVal(messages, props.key)
    let { param } = props
    isVNode(param) && (param = { slot: param })
    return param ? Object.entries(param).reduce(findParamAndReplace, [result]) : result
}

const jsLocale = () => locale.replace('_', '-')

export const tNum = (val: number) => val.toLocaleString(jsLocale())

type PtFmtOptions = Pick<Intl.NumberFormatOptions, 'roundingMode'> & {
    displaySign?: boolean
}
export const ptFmt = (fraction: number, options?: PtFmtOptions) => new Intl.NumberFormat(jsLocale(), {
    style: "percent",
    minimumFractionDigits: fraction,
    maximumFractionDigits: fraction,
    roundingMode: options?.roundingMode ?? "halfCeil",
    signDisplay: options?.displaySign ? 'always' : 'auto',
})

export const durFmt = () => new Intl.DurationFormat(jsLocale(), { style: "narrow" })

export const unitFmt = (unit: "minute" | "second" | "hour" | "millisecond", fraction?: number) =>
    new Intl.NumberFormat(
        jsLocale(),
        { style: "unit", unit, maximumFractionDigits: fraction, minimumFractionDigits: fraction },
    )

export const dateFmt = (opt?: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(jsLocale(), opt)

export const dateTimeFmt = () => dateFmt({
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    hour12: false,
    minute: "numeric",
    second: "numeric",
})

export const tDateRangeSeparator = (): string => {
    const fmt = dateFmt({ month: 'numeric', day: 'numeric' })
    const parts = fmt.formatRangeToParts(new Date(1970, 0, 1), new Date(1970, 0, 2))

    let startFinished = false
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i]
        if (!part) continue
        const { source, type, value } = part
        if (source === 'startRange') startFinished = true
        if (startFinished && source === 'shared' && type === 'literal') return value
    }
    return '-'
}

const MONDAY = new Date(2023, 0, 2)
export const tWeekDays = (): string[] => {
    const fmt = dateFmt({ weekday: 'short' })
    return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(MONDAY)
        date.setDate(date.getDate() + i)
        return fmt.format(date)
    })
}

export const tYMD = (): string => {
    const parts = dateFmt({ year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date())
    return parts
        .map(({ type: t, value: v }) => t === 'year' ? 'YYYY' : t === 'month' ? 'MM' : t === 'day' ? 'DD' : v)
        .join('')
}

const formatUnsignedDuration = (milliseconds: number): string => {
    const totalSec = Math.floor(milliseconds / 1000)
    if (!totalSec) return unitFmt('second', 0).format(totalSec)
    const days = Math.floor(totalSec / 86400)
    const hours = Math.floor(totalSec / 3600 - days * 24)
    const minutes = Math.floor(totalSec / 60 - (days * 24 + hours) * 60)
    const seconds = totalSec - days * 86400 - hours * 3600 - minutes * 60
    return durFmt().format({ days, hours, minutes, seconds })
}

export function fmtDuration(milliseconds: number): string {
    const str = formatUnsignedDuration(Math.abs(milliseconds))
    return milliseconds < 0 ? '-' + str : str
}

export function fmtHourMinute(totalMin: number): string {
    const days = Math.floor(totalMin / 1440)
    const hours = Math.floor(totalMin / 60) - days * 24
    const minutes = totalMin % 60
    return durFmt().format({ days, hours, minutes })
}
