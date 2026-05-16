import { readdirSync, readFileSync } from "fs"
import { join } from "path"
import { getClientFromEnv } from "./client"
import {
    ALL_DIRS, ALL_TRANS_LOCALES, checkMainBranch, crowdinLangOf, type Dir, type ItemSet, mergeMessage, RSC_FILE_SUFFIX,
    transMsg
} from "./common"
import { clearTempFile, downloadProjectZip } from "./download"

async function processDir(tmpDir: string, dir: Dir): Promise<void> {
    const fileSets: Record<string, Partial<Record<timer.Locale, ItemSet>>> = {}
    for (const locale of ALL_TRANS_LOCALES) {
        const crowdinLang = crowdinLangOf(locale)
        const dirPath = join(tmpDir, crowdinLang, dir)
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

async function main() {
    const client = getClientFromEnv()
    const branch = await checkMainBranch(client)
    const zipUrl = await client.buildProjectTranslation(branch.id)
    console.log("Built project translations")
    console.log(zipUrl)
    const tmpDir = await downloadProjectZip(zipUrl)

    for (const dir of ALL_DIRS) {
        await processDir(tmpDir, dir)
        console.log("Processed dir: " + dir)
    }
}

main().finally(clearTempFile)