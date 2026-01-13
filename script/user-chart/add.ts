import {
    createGist as createGistApi,
    type FileForm,
    getJsonFileContent,
    type Gist,
    type GistForm,
    updateGist as updateGistApi
} from "@src/api/gist"
import { CHROME_ID } from "@src/util/constant/meta"
import fs from "fs"
import { exitWith } from "../util/process"
import { type Browser, descriptionOf, filenameOf, getExistGist, type UserCount, validateTokenFromEnv } from "./common"

type AutoMode = {
    mode: 'auto'
    dirPath: string
}

type ManualMode = {
    mode: 'manual'
    browser: Browser
    fileName: string
}

type AddArgv = AutoMode | ManualMode

const BROWSER_MAP: Record<string, Browser> = {
    c: 'chrome',
    e: 'edge',
    f: 'firefox',
}

function parseArgv(): AddArgv {
    const argv = process.argv.slice(2)
    const [a0, a1] = argv

    if (!a0) {
        exitWith("add.ts [c/e/f] [file_name] OR add.ts auto [dir_path]")
    }

    if (a0 === 'auto') {
        if (!a1) exitWith("add.ts auto [dir_path]")
        return { mode: 'auto', dirPath: a1 }
    }

    if (!a1) {
        exitWith("add.ts [c/e/f] [file_name] OR add.ts auto [dir_path]")
    }

    const browser: Browser = BROWSER_MAP[a0]
    if (!browser) {
        exitWith("add.ts [c/e/f] [file_name]")
    }

    return { mode: 'manual', browser, fileName: a1 }
}

function detectBrowser(fileName: string): Browser | null {
    if (fileName.includes(CHROME_ID)) return 'chrome'
    if (fileName.includes('usage-day-')) return 'firefox'
    if (fileName.includes('edgeaddon_analytics')) return 'edge'
    return null
}

function sortDataByKey(data: UserCount): UserCount {
    const sorted: UserCount = {}
    Object.keys(data).sort().forEach(key => sorted[key] = data[key])
    return sorted
}

async function createGist(token: string, browser: Browser, data: UserCount) {
    const description = descriptionOf(browser)
    const filename = filenameOf(browser)
    const sorted = sortDataByKey(data)
    const files: Record<string, FileForm> = {
        [filename]: {
            filename,
            content: JSON.stringify(sorted, null, 2)
        }
    }
    const gistForm: GistForm = {
        public: true,
        description,
        files
    }
    await createGistApi(token, gistForm)
}

async function updateGist(token: string, browser: Browser, data: UserCount, gist: Gist) {
    const description = descriptionOf(browser)
    const filename = filenameOf(browser)
    // 1. merge
    const file = gist.files[filename]
    const existData = (await getJsonFileContent<UserCount>(file!)) || {}
    Object.entries(data).forEach(([key, val]) => existData[key] = val)
    // 2. sort by key
    const sorted: UserCount = {}
    Object.keys(existData).sort().forEach(key => sorted[key] = existData[key])
    const files: Record<string, FileForm> = {}
    files[filename] = { filename: filename, content: JSON.stringify(sorted, null, 2) }
    const gistForm: GistForm = { public: true, description, files }
    await updateGistApi(token, gist.id, gistForm)
}

function parseChrome(content: string): UserCount {
    const lines = content.split('\n')
    const result: Record<string, number> = {}
    if (!(lines?.length > 2)) {
        return result
    }
    lines.slice(2).forEach(line => {
        const [dateStr, numberStr] = line.split(',')
        if (!dateStr || !numberStr) {
            return
        }
        // Replace '/' to '-', then rjust month and date
        const date = dateStr.split('/').map(str => rjust(str, 2, '0')).join('-')
        const number = parseInt(numberStr)
        date && number && (result[date] = number)
    })
    return result
}

function parseEdge(content: string): UserCount {
    const lines = content.split('\n')
    const result: Record<string, number> = {}
    if (!(lines?.length > 1)) {
        return result
    }
    lines.slice(1).forEach(line => {
        const splits = line.split(',')
        const dateStr = splits[5]
        const numberStr = splits[6]
        if (!dateStr || !numberStr) {
            return
        }
        // Replace '/' to '-', then rjust month and date
        const date = dateStr.split('/').map(str => rjust(str, 2, '0')).join('-')
        const number = parseInt(numberStr)
        date && number && (result[date] = number)
    })
    return result
}

function parseFirefox(content: string): UserCount {
    const lines = content.split('\n')
    const result: Record<string, number> = {}
    if (!(lines?.length > 4)) {
        return result
    }
    lines.slice(4).forEach(line => {
        const splits = line.split(',')
        const date = splits[0]
        const numberStr = splits[1]
        if (!date || !numberStr) {
            return
        }
        const number = parseInt(numberStr)
        date && number && (result[date] = number)
    })
    return result
}

function rjust(str: string, num: number, padding: string): string {
    str = str || ''
    if (str.length >= num) {
        return str
    }
    return Array.from(new Array(num - str.length).keys()).map(_ => padding).join('') + str
}

const PARSERS: Record<Browser, (content: string) => UserCount> = {
    chrome: parseChrome,
    edge: parseEdge,
    firefox: parseFirefox,
}

async function processFile(browser: Browser, filePath: string): Promise<UserCount> {
    const content = fs.readFileSync(filePath, { encoding: 'utf-8' })
    return PARSERS[browser](content)
}

function groupFilesByBrowser(files: string[]): Record<Browser, string[]> {
    const grouped: Record<Browser, string[]> = { chrome: [], edge: [], firefox: [] }
    for (const file of files) {
        const browser = detectBrowser(file)
        if (browser) {
            grouped[browser].push(file)
        } else {
            console.warn(`Unknown file format, skipping: ${file}`)
        }
    }
    return grouped
}

function mergeData(target: UserCount, source: UserCount): void {
    Object.entries(source).forEach(([key, val]) => {
        target[key] = target[key] ? Math.max(target[key], val) : val
    })
}

async function processDirectory(token: string, dirPath: string) {
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.csv'))
    if (files.length === 0) exitWith(`No CSV files found in ${dirPath}`)

    const filesByBrowser = groupFilesByBrowser(files)

    for (const [browser, browserFiles] of Object.entries(filesByBrowser)) {
        if (browserFiles.length === 0) continue

        const typedBrowser = browser as Browser
        console.log(`Processing ${browser.toUpperCase()}: ${browserFiles.length} file(s)`)

        let mergedData: UserCount = {}
        for (const file of browserFiles) {
            const filePath = `${dirPath}/${file}`
            console.log(`Processing: ${file}`)
            const data = await processFile(typedBrowser, filePath)
            mergeData(mergedData, data)
        }

        if (Object.keys(mergedData).length === 0) {
            console.log(`No valid data found for ${browser}`)
            continue
        }

        console.log(`Merged ${Object.keys(mergedData).length} date entries for ${browser}`)

        const gist = await getExistGist(token, typedBrowser)
        if (!gist) {
            console.log(`Creating new gist for ${browser}...`)
            await createGist(token, typedBrowser, mergedData)
        } else {
            console.log(`Updating existing gist for ${browser}...`)
            await updateGist(token, typedBrowser, mergedData, gist)
        }
        console.log(`${browser.toUpperCase()} completed successfully!`)
    }
}

async function main() {
    const token = validateTokenFromEnv()
    const argv = parseArgv()

    if (argv.mode === 'auto') {
        return await processDirectory(token, argv.dirPath)
    }

    const { browser, fileName } = argv

    const newData = await processFile(browser, fileName)
    const gist = await getExistGist(token, browser)
    if (!gist) {
        await createGist(token, browser, newData)
    } else {
        await updateGist(token, browser, newData, gist)
    }
}

main()