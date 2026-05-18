import decompress from "decompress"
import { existsSync, readdirSync, readFileSync, rm, writeFile } from "fs"
import { join } from "path"
import { getClientFromEnv } from "./client"
import {
    ALL_DIRS, ALL_TRANS_LOCALES,
    checkMainBranch,
    crowdinLangOf,
    type Dir,
    type ItemSet,
    mergeMessage,
    RSC_FILE_SUFFIX,
    transMsg
} from "./common"

const TEMP_FILE_NAME = join(process.cwd(), ".crowdin-temp.zip")
const TEMP_DIR = join(process.cwd(), ".crowdin-temp")

async function processDir(dir: Dir): Promise<void> {
    const fileSets: Record<string, Partial<Record<tt4b.Locale, ItemSet>>> = {}
    for (const locale of ALL_TRANS_LOCALES) {
        const crowdinLang = crowdinLangOf(locale)
        const dirPath = join(TEMP_DIR, crowdinLang, dir)
        const files = readdirSync(dirPath)
        for (const fileName of files) {
            const json = readFileSync(join(dirPath, fileName)).toString()
            const itemSets = fileSets[fileName] || {}
            itemSets[locale] = transMsg(JSON.parse(json))
            fileSets[fileName] = itemSets
        }
    }
    for (const [fileName, itemSets] of Object.entries(fileSets)) {
        await mergeMessage(dir, fileName.replace('.json', RSC_FILE_SUFFIX), itemSets)
    }
}

async function downloadProjectZip(url: string): Promise<void> {
    const res = await fetch(url)
    const blob = await res.blob()
    const buffer = Buffer.from(await blob.arrayBuffer())
    await new Promise(resolve => writeFile(TEMP_FILE_NAME, buffer, resolve))
}

async function compressProjectZip(): Promise<void> {
    if (existsSync(TEMP_DIR)) {
        await new Promise(resolve => rm(TEMP_DIR, { recursive: true }, resolve))
    }
    await decompress(TEMP_FILE_NAME, TEMP_DIR)
}

async function clearTempFile() {
    await new Promise(resolve => rm(TEMP_FILE_NAME, resolve))
    await new Promise(resolve => rm(TEMP_DIR, { recursive: true }, resolve))
}

async function main() {
    const client = getClientFromEnv()
    const branch = await checkMainBranch(client)
    const zipUrl = await client.buildProjectTranslation(branch.id)
    console.log("Built project translations")
    console.log(zipUrl)
    await downloadProjectZip(zipUrl)
    console.log("Downloaded project zip file")
    try {
        await compressProjectZip()
        console.log("Compressed zip file")
        for (const dir of ALL_DIRS) {
            await processDir(dir)
            console.log("Processed dir: " + dir)
        }
    } finally {
        clearTempFile()
        console.log("Cleaned temp files")
    }
}

main()