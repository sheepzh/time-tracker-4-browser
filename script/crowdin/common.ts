import { type SourceFilesModel } from '@crowdin/crowdin-api-client'
import fs from 'fs'
import path from 'path'
import { exitWith } from '../util/process'
import { type CrowdinClient } from './client'

export const ALL_DIRS = ['app', 'common', 'popup', 'side', 'cs'] as const

/**
 * The directory of messages
 */
export type Dir = typeof ALL_DIRS[number]

/**
 * Items of message
 */
export type ItemSet = {
    [path: string]: string
}

export const ALL_CROWDIN_LANGUAGES = ['zh-CN', 'zh-TW', 'ja', 'pt-PT', 'uk', 'es-ES', 'de', 'fr', 'ru', 'ar'] as const

/**
 * The language code of crowdin
 *
 * @see https://developer.crowdin.com/language-codes/
 */
export type CrowdinLanguage = typeof ALL_CROWDIN_LANGUAGES[number]

export const SOURCE_LOCALE: timer.RequiredLocale = 'en'

// Not include en and zh_CN
export const ALL_TRANS_LOCALES: timer.OptionalLocale[] = [
    'zh_CN',
    'ja',
    'zh_TW',
    'pt_PT',
    'uk',
    'es',
    'de',
    'fr',
    'ru',
    'ar',
]

const CROWDIN_I18N_MAP: Record<CrowdinLanguage, timer.OptionalLocale> = {
    "zh-CN": 'zh_CN',
    ja: 'ja',
    'zh-TW': 'zh_TW',
    'pt-PT': 'pt_PT',
    uk: 'uk',
    'es-ES': 'es',
    de: 'de',
    fr: 'fr',
    ru: 'ru',
    ar: 'ar',
}

const I18N_CROWDIN_MAP: Record<timer.OptionalLocale, CrowdinLanguage> = {
    zh_CN: 'zh-CN',
    ja: 'ja',
    zh_TW: 'zh-TW',
    pt_PT: 'pt-PT',
    uk: 'uk',
    es: 'es-ES',
    de: 'de',
    fr: 'fr',
    ru: 'ru',
    ar: 'ar',
}

export const crowdinLangOf = (locale: timer.OptionalLocale): CrowdinLanguage => I18N_CROWDIN_MAP[locale]

export const localeOf = (crowdinLang: CrowdinLanguage) => CROWDIN_I18N_MAP[crowdinLang]

const IGNORED_FILE: Partial<{ [dir in Dir]: string[] }> = {
    common: [
        // Strings for market
        'meta',
        // Name of locales
        'locale',
    ]
}

export function isIgnored(dir: Dir, fileName: string) {
    return !!IGNORED_FILE[dir]?.includes(fileName)
}

export const MSG_BASE = path.join(__dirname, '..', '..', 'src', 'i18n', 'message')
export const RSC_FILE_SUFFIX = "-resource.json"

/**
 * Read all messages from source file
 *
 * @param dir the directory of messages
 * @returns
 */
export async function readAllMessages(dir: Dir): Promise<Record<string, Messages<any>>> {
    const dirPath = path.join(MSG_BASE, dir)

    const files = fs.readdirSync(dirPath)
    const result: Record<string, any> = {}
    await Promise.all(files.map(async file => {
        if (!file.endsWith(RSC_FILE_SUFFIX)) {
            return
        }
        const message = (await import(`@i18n/message/${dir}/${file}`))?.default as Messages<any>
        const name = file.replace(RSC_FILE_SUFFIX, '')
        message && (result[name] = message)
        return
    }))
    return result
}

/**
 * Merge crowdin message into locale resource json files
 *
 * @param dir dir
 * @param filename the name of json file
 * @param messages crowdin messages
 */
export async function mergeMessage(
    dir: Dir,
    filename: string,
    messages: Partial<Record<timer.Locale, ItemSet>>
): Promise<void> {
    const dirPath = path.join(MSG_BASE, dir)
    const filePath = path.join(dirPath, filename)
    const existMessages = (await import(`@i18n/message/${dir}/${filename}`))?.default as Messages<any>
    if (!existMessages) {
        console.error(`Failed to find local code: dir=${dir}, filename=${filename}`)
        return
    }
    const sourceItemSet = transMsg(existMessages[SOURCE_LOCALE])
    const sourceKeyIdx = Object.keys(sourceItemSet)
    Object.entries(messages).forEach(([locale, itemSet]) => {
        const newMessage: any = {}
        Object.entries(itemSet)
            .sort((a, b) => (sourceKeyIdx.findIndex(v => v === a[0]) - sourceKeyIdx.findIndex(v => v === b[0])))
            .forEach(([path, text]) => {
                // Not translated
                if (!text) return
                const sourceText = sourceItemSet[path]
                // Deleted key
                if (!sourceText) return
                if (!checkPlaceholder(text, sourceText)) {
                    console.error(`Invalid placeholder: dir=${dir}, filename=${filename}, path=${path}, source=${sourceText}, translated=${text}`)
                    return
                }
                const pathSeg = path.split('.')
                fillItem(pathSeg, 0, newMessage, text)
            })
        Object.entries(newMessage).length && (existMessages[locale as timer.Locale] = newMessage)
    })

    const newFileContent = JSON.stringify(existMessages, null, 4)
    fs.writeFileSync(filePath, newFileContent, { encoding: 'utf-8' })
}

function checkPlaceholder(translated: string, source: string) {
    const allSourcePlaceholders =
        Array.from(source.matchAll(/\{(.*?)\}/g))
            .map(matched => matched[1])
            .sort()
    const allTranslatedPlaceholders =
        Array.from(translated.matchAll(/\{(.*?)\}/g))
            .map(matched => matched[1])
            .sort()
    if (allSourcePlaceholders.length != allTranslatedPlaceholders.length) {
        return false
    }
    for (let i = 0; i++; i < allSourcePlaceholders.length) {
        if (allSourcePlaceholders[i] !== allTranslatedPlaceholders[i]) {
            return false
        }
    }
    return true
}

function fillItem(fields: string[], index: number, obj: Record<string, any>, text: string) {
    const field = fields[index]
    if (index === fields.length - 1) {
        obj[field] = text
        return
    }
    let sub = obj[field]
    if (sub === undefined) {
        obj[field] = sub = {}
    } else if (typeof sub !== 'object') {
        exitWith("Invalid key path: " + fields.join('.'))
    }
    fillItem(fields, index + 1, sub, text)
}

/**
 * Trans msg object to k-v map
 */
export function transMsg(message: any, prefix?: string): ItemSet {
    const result: Record<string, any> = {}
    const pathPrefix = prefix ? prefix + '.' : ''
    Object.entries(message).forEach(([key, value]) => {
        const path = pathPrefix + key
        if (typeof value === 'object') {
            const subResult = transMsg(value, path)
            Object.entries(subResult)
                .forEach(([path, val]) => result[path] = val)
        } else {
            let realVal = value
            // Replace tab with blank
            typeof value === 'string' && (realVal = value.replace(/\s{4}/g, ''))
            result[path] = realVal
        }
    })
    return result
}

export async function checkMainBranch(client: CrowdinClient): Promise<SourceFilesModel.Branch> {
    const branch = await client.getMainBranch()
    if (!branch) {
        exitWith("Main branch is null")
    }
    return branch!
}
