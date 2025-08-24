import { type SourceFilesModel, type SourceStringsModel } from "@crowdin/crowdin-api-client"
import { toMap } from "@util/array"
import { type CrowdinClient, getClientFromEnv, type NameKey } from "./client"
import {
    ALL_DIRS,
    Dir,
    isIgnored,
    ItemSet,
    readAllMessages,
    SOURCE_LOCALE,
    transMsg
} from "./common"

async function initBranch(client: CrowdinClient): Promise<SourceFilesModel.Branch> {
    const branch = await client.getOrCreateMainBranch()
    if (!branch) {
        console.error("Failed to create main branch")
        process.exit(1)
    }
    return branch
}

/**
 * Process strings
 *
 * @param client client
 * @param existFile exist crowdin file
 * @param fileContent strings
 */
async function processStrings(
    client: CrowdinClient,
    existFile: SourceFilesModel.File,
    fileContent: ItemSet,
) {
    const existStrings = await client.listStringsByFile(existFile.id)
    const existStringsKeyMap = toMap(existStrings, s => s.identifier)
    const strings2Delete: SourceStringsModel.String[] = []
    const strings2Create: ItemSet = {}
    const strings2Update: ItemSet = {}
    Object.entries(fileContent).forEach(([path, text]) => {
        if (!text) {
            // maybe blank or undefined sometimes
            return
        }
        const existString = existStringsKeyMap[path]
        if (existString) {
            strings2Update[path] = text
        } else {
            strings2Create[path] = text
        }
    })
    Object.entries(existStringsKeyMap).forEach(([path, string]) => !fileContent[path] && strings2Delete.push(string))
    await client.batchCreateString(existFile.id, strings2Create)
    await client.batchUpdateIfNecessary(strings2Update, existStringsKeyMap)
    await client.batchDeleteString(strings2Delete.map(s => s.id))
}


async function processByDir(client: CrowdinClient, dir: Dir, branch: SourceFilesModel.Branch): Promise<void> {
    // 1. init directory
    const dirKey: NameKey = { name: dir, branchId: branch.id }
    let directory = await client.getDirByName(dirKey)
    if (!directory) {
        directory = await client.createDirectory(dirKey)
    }
    console.log('Directory: ' + JSON.stringify(directory))
    // 2. iterate all messages
    const messages = await readAllMessages(dir)
    console.log(`Found ${Object.keys(messages).length} message(s)`)
    // 3. list all files in directory
    const existFiles = await client.listFilesByDirectory(directory.id)
    console.log("Exists file count: " + existFiles.length)
    const existFileNameMap = toMap(existFiles, f => f.name)
    // 4. create new files
    for (const [fileName, msg] of Object.entries(messages)) {
        if (isIgnored(dir, fileName)) {
            console.log(`Ignored file: ${dir}/${fileName}`)
            continue
        }
        const crowdinFilename = fileName + '.json'
        const fileContent = transMsg(msg[SOURCE_LOCALE])
        let existFile = existFileNameMap[crowdinFilename]
        if (!existFile) {
            // Create with empty file
            const storage = await client.createStorage(crowdinFilename, fileContent)
            existFile = await client.createFile(directory.id, storage, crowdinFilename)
            console.log(`Created new file: dir=${dir}, fileName=${crowdinFilename}, id=${existFile.id}`)
        }
        // Process by strings
        await processStrings(client, existFile, fileContent)
    }
}

async function main() {
    const client = getClientFromEnv()
    // Init main branch
    const branch = await initBranch(client)
    // Process by dir
    for (const dir of ALL_DIRS) {
        await processByDir(client, dir, branch)
    }
}

main()