import {
    createGist as createGistApi,
    type FileForm,
    getJsonFileContent,
    type Gist,
    type GistForm,
    updateGist as updateGistApi
} from "@src/api/gist"
import fs from "fs"
import { exitWith } from "../util/process"
import { type Browser, descriptionOf, filenameOf, getExistGist, type UserCount, validateTokenFromEnv } from "./common"

type AddArgv = {
    browser: Browser
    fileName: string
}

function parseArgv(): AddArgv {
    const argv = process.argv.slice(2)
    const browserArgv = argv[0]
    const fileName = argv[1]
    if (!browserArgv || !fileName) {
        exitWith("add.ts [c/e/f] [file_name]")
    }
    const browserArgvMap: Record<string, Browser> = {
        c: 'chrome',
        e: 'edge',
        f: 'firefox',
    }
    const browser: Browser = browserArgvMap[browserArgv]
    if (!browser) {
        exitWith("add.ts [c/e/f] [file_name]")
    }
    return {
        browser,
        fileName
    }
}

async function createGist(token: string, browser: Browser, data: UserCount) {
    const description = descriptionOf(browser)
    const filename = filenameOf(browser)

    // 1. sort by key
    const sorted: UserCount = {}
    Object.keys(data).sort().forEach(key => sorted[key] = data[key])
    // 2. create
    const files: Record<string, FileForm> = {}
    files[filename] = { filename: filename, content: JSON.stringify(sorted, null, 2) }
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
    const gistForm: GistForm = {
        public: true,
        description,
        files
    }
    updateGistApi(token, gist.id, gistForm)
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

async function main() {
    const token = validateTokenFromEnv()
    const argv: AddArgv = parseArgv()
    const browser = argv.browser
    const fileName = argv.fileName
    const content = fs.readFileSync(fileName, { encoding: 'utf-8' })
    let newData: UserCount = {}
    if (browser === 'chrome') {
        newData = parseChrome(content)
    } else if (browser === 'edge') {
        newData = parseEdge(content)
    } else if (browser === 'firefox') {
        newData = parseFirefox(content)
    } else {
        exitWith("Un-supported browser: " + browser)
    }
    const gist = await getExistGist(token, browser)
    if (!gist) {
        await createGist(token, browser, newData)
    } else {
        await updateGist(token, browser, newData, gist)
    }
}

main()