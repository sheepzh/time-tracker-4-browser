import type { SourceFilesModel, SourceStringsModel } from "@crowdin/crowdin-api-client"
import { toMap } from "@util/array"
import { exitWith } from "../util/process"
import { type CrowdinClient, getClientFromEnv } from "./client"
import {
    ALL_DIRS, ALL_TRANS_LOCALES, checkMainBranch, crowdinLangOf, type CrowdinLanguage, type Dir, isIgnored,
    readAllMessages, transMsg,
} from "./common"
import { clearTempFile, downloadProjectZip, readCrowdinZipFile } from "./download"

const CROWDIN_USER_ID_OF_OWNER = 15266594

/**
 * Sync translation for a single string.
 * Keeps the same behavior as the original processDirMessage:
 * 1. Delete all owner's translations that differ from current text
 * 2. Create new translation if no matching one exists
 */
async function syncStringTranslation(
    client: CrowdinClient,
    stringId: number,
    text: string,
    lang: CrowdinLanguage,
): Promise<void> {
    const existList = await client.listTranslationByStringAndLang({ stringId, lang })
    // Delete old translations by owner that differ from current
    const oldByOwner = existList.filter(t => t.user.id === CROWDIN_USER_ID_OF_OWNER && t.text !== text)
    for (const toDelete of oldByOwner) {
        await client.deleteTranslation(toDelete.id)
        console.log(`Deleted translation by owner: stringId=${stringId}, lang=${lang}, text=${toDelete.text}`)
    }
    if (!existList.some(t => t.text === text)) {
        await client.createTranslation({ stringId, lang }, text)
        console.log(`Created trans: stringId=${stringId}, lang=${lang}, text=${text}`)
    }
}
/**
 * Process translations for a single file across all locales
 */
async function processFile(client: CrowdinClient, options: {
    dir: Dir
    fileName: string
    message: Messages<Record<string, unknown>>
    crowdinFile: SourceFilesModel.File
    tmpDir: string
}): Promise<void> {
    const { dir, fileName, message, crowdinFile, tmpDir } = options
    const crowdinFileName = fileName + '.json'
    let stringMap: Record<string, SourceStringsModel.String> = {}
    let stringMapLoaded = false

    for (const locale of ALL_TRANS_LOCALES) {
        const translated = message[locale]
        if (!translated || !Object.keys(translated).length) {
            continue
        }

        const crowdinLang = crowdinLangOf(locale)
        const strings = transMsg(translated)
        const crowdinStrings = readCrowdinZipFile(tmpDir, crowdinLang, dir, crowdinFileName)

        // Compare locally first — find strings that actually differ
        const diffKeys = Object.entries(strings).filter(([identifier, text]) => {
            if (!text) return false
            return crowdinStrings[identifier] !== text
        })

        if (!diffKeys.length) {
            console.log(`No diff for ${dir}/${fileName} [${crowdinLang}], skipped`)
            continue
        }

        console.log(`Found ${diffKeys.length} diff(s) for ${dir}/${fileName} [${crowdinLang}]`)

        if (!stringMapLoaded) {
            const existStrings = await client.listStringsByFile(crowdinFile.id)
            stringMap = toMap(existStrings, s => s.identifier)
            stringMapLoaded = true
        }

        for (const [identifier, text] of diffKeys) {
            const string = stringMap[identifier]
            if (!string) {
                console.log(`Can't find string of identifier: ${identifier}, file: ${crowdinFile.path}`)
                continue
            }
            if (text === string.text) {
                console.log(`Translation same as origin text of ${string.identifier} in ${crowdinFile.path}`)
                continue
            }
            await syncStringTranslation(client, string.id, text, crowdinLang)
        }
    }
}

/**
 * Compare local translations with Crowdin zip, only sync differences
 */
async function processDir(
    client: CrowdinClient,
    dir: Dir,
    branch: SourceFilesModel.Branch,
    tmpDir: string,
): Promise<void> {
    const messages = await readAllMessages(dir)
    const directory = await client.getDirByName({ name: dir, branchId: branch.id })
    if (!directory) {
        exitWith("Directory not found: " + dir)
    }
    const files = await client.listFilesByDirectory(directory.id)
    console.log(`find ${files.length} files of ${dir}`)
    const fileMap = toMap(files, f => f.name)
    for (const [fileName, message] of Object.entries(messages)) {
        if (isIgnored(dir, fileName)) {
            console.log(`Ignored file: ${dir}/${fileName}`)
            continue
        }
        const crowdinFileName = fileName + '.json'
        const crowdinFile = fileMap[crowdinFileName]
        if (!crowdinFile) {
            console.log(`Failed to find file: dir=${dir}, filename=${fileName}`)
            continue
        }
        await processFile(client, { dir, fileName, message, crowdinFile, tmpDir })
    }
}

async function main() {
    const client = getClientFromEnv()
    const branch = await checkMainBranch(client)

    // Download all translations as zip for local comparison
    const zipUrl = await client.buildProjectTranslation(branch.id)
    const tmpDir = await downloadProjectZip(zipUrl)
    console.log("Downloaded project zip to: " + tmpDir)

    for (const dir of ALL_DIRS) {
        await processDir(client, dir, branch, tmpDir)
    }
}

main().finally(clearTempFile)