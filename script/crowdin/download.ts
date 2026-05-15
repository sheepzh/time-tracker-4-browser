import decompress from "decompress"
import { existsSync, readFileSync } from "fs"
import { rm, writeFile } from "fs/promises"
import { join } from "path"
import { type Dir, type ItemSet, transMsg } from "./common"

const TEMP_FILE_NAME = join(process.cwd(), ".crowdin-temp.zip")
const TEMP_DIR = join(process.cwd(), ".crowdin-temp")

export async function downloadProjectZip(url: string): Promise<string> {
    const res = await fetch(url)
    const blob = await res.blob()
    const buffer = Buffer.from(await blob.arrayBuffer())
    await writeFile(TEMP_FILE_NAME, buffer)
    console.log("Downloaded project zip file")
    if (existsSync(TEMP_DIR)) {
        await rm(TEMP_DIR, { recursive: true, force: true })
    }
    await decompress(TEMP_FILE_NAME, TEMP_DIR)
    console.log("Decompressed zip file")
    return TEMP_DIR
}

export async function clearTempFile() {
    await rm(TEMP_FILE_NAME, { force: true })
    await rm(TEMP_DIR, { recursive: true, force: true })
}

/**
 * Read a single file from the unzipped Crowdin project translation.
 *
 * @param tmpDir temp directory containing unzipped translations
 * @param langDir language subdirectory (e.g. 'zh-CN' or 'en')
 * @param dir message directory
 * @param crowdinFileName file name with .json extension
 */
export function readCrowdinZipFile(tmpDir: string, langDir: string, dir: Dir, crowdinFileName: string): ItemSet {
    const filePath = join(tmpDir, langDir, dir, crowdinFileName)
    if (!existsSync(filePath)) {
        return {}
    }
    try {
        const json = readFileSync(filePath).toString()
        return transMsg(JSON.parse(json))
    } catch (error) {
        console.warn(`Failed to parse crowdin zip file: ${filePath}`, error)
        return {}
    }
}
