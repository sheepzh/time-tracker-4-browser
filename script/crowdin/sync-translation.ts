
import { type SourceFilesModel } from "@crowdin/crowdin-api-client"
import { toMap } from "@util/array"
import { exitWith } from "../util/process"
import { type CrowdinClient, getClientFromEnv } from "./client"
import {
    ALL_DIRS, ALL_TRANS_LOCALES,
    type CrowdinLanguage, type Dir, type ItemSet,
    checkMainBranch, crowdinLangOf, isIgnored, readAllMessages, transMsg,
} from "./common"

const CROWDIN_USER_ID_OF_OWNER = 15266594

async function processDirMessage(client: CrowdinClient, file: SourceFilesModel.File, message: ItemSet, lang: CrowdinLanguage): Promise<void> {
    console.log(`Start to process dir message: fileName=${file.name}, lang=${lang}`)
    const strings = await client.listStringsByFile(file.id)
    const stringMap = toMap(strings, s => s.identifier)
    for (const [identifier, text] of Object.entries(message)) {
        const string = stringMap[identifier]
        if (!string) {
            console.log(`Can't found string of identifier: ${identifier}, file: ${file.path}`)
            continue
        }
        if (text === string.text) {
            // The same as original text
            console.log(`Translation same as origin text of ${string.identifier} in ${file.path}`)
            continue
        }
        const existList = await client.listTranslationByStringAndLang({ stringId: string.id, lang })
        // Deleted old translations different from current
        const oldByOwner = existList?.filter(t => t?.user?.id === CROWDIN_USER_ID_OF_OWNER && t.text !== text)
        for (const toDelete of oldByOwner || []) {
            await client.deleteTranslation(toDelete.id)
            console.log(`Deleted translation by owner: stringId=${string.id}, lang=${lang}, text=${toDelete.text}`)
        }
        if (!existList?.find(t => t.text === text)) {
            // Create new translation
            await client.createTranslation({ stringId: string.id, lang }, text)
            console.log(`Created trans: stringId=${string.id}, lang=${lang}, text=${text}`)
        }
    }
}

async function processDir(client: CrowdinClient, dir: Dir, branch: SourceFilesModel.Branch): Promise<void> {
    const messages = await readAllMessages(dir)
    const directory = await client.getDirByName({
        name: dir,
        branchId: branch.id,
    })
    if (!directory) {
        exitWith("Directory not found: " + dir)
    }
    const files = await client.listFilesByDirectory(directory!.id)
    console.log(`find ${files.length} files of ${dir}`)
    const fileMap = toMap(files, f => f.name)
    for (const [fileName, message] of Object.entries(messages)) {
        console.log(`Start to sync translations of ${dir}/${fileName}`)
        if (isIgnored(dir, fileName)) {
            console.log("Ignored file: " + fileName)
            continue
        }
        const crowdinFileName = fileName + '.json'
        const crowdinFile = fileMap[crowdinFileName]
        if (!crowdinFile) {
            console.log(`Failed to find file: dir=${dir}, filename=${fileName}`)
            continue
        }

        for (const locale of ALL_TRANS_LOCALES) {
            const translated = message[locale]
            if (!translated || !Object.keys(translated).length) {
                continue
            }
            const strings = transMsg(message[locale])
            const crowdinLang = crowdinLangOf(locale)
            await processDirMessage(client, crowdinFile, strings, crowdinLang)
        }
    }
}

async function main() {
    const client = getClientFromEnv()
    const branch = await checkMainBranch(client)

    for (const dir of ALL_DIRS) {
        await processDir(client, dir, branch)
    }
}

main()