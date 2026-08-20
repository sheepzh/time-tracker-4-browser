import { readFileSync } from 'fs'
import { join } from 'path'
import { createArrayGuard, createObjectGuard, createOptionalGuard, createStringUnionGuard, isBoolean } from 'typescript-guard'
import { fileURLToPath } from 'url'
import { parseArgs, ParseArgsOptionsConfig } from 'util'
import { version as current } from '../../package.json'
import { exitWith } from '../util/process'
import { listFirefoxVersions, updateFirefoxReleaseNote } from './firefox'

type ChangeLog = {
    version: string
    date: string
    changes: string[]
}

function parseChangelog(): ChangeLog[] {
    const filePath = join(fileURLToPath(import.meta.url), '..', '..', '..', 'CHANGELOG.md')
    const content = readFileSync(filePath, 'utf-8')

    const entries: ChangeLog[] = []
    const parts = content.split(/^## \[/m)
    for (let i = 1; i < parts.length; i++) {
        const part = parts[i]
        if (!part) continue
        const firstLineEnd = part.indexOf('\n')
        if (firstLineEnd === -1) continue
        const header = part.substring(0, firstLineEnd).trim()
        const match = header.match(/^([^\]]+)\] - (.*)$/)
        let version: string | undefined
        let date: string | undefined
        if (match) {
            version = match[1]?.trim()
            date = match[2]?.trim()
        }
        if (!version || !date) {
            console.log(`Invalid changelog entry: ${header}`)
            continue
        }
        const lines = part.split('\n')
        const changes: string[] = []
        for (const line of lines) {
            if (line.trim().startsWith('- ')) {
                changes.push(line.trim().substring(2).trim())
            }
        }
        entries.push({
            version,
            date,
            changes
        })
    }
    return entries
}

type Channel = 'chrome' | 'firefox' | 'edge'
type Args = {
    all: boolean
    channel?: Channel[]
}
const isChannel = createStringUnionGuard<Channel>('chrome', 'firefox', 'edge')
const isArgs = createObjectGuard<Args>({
    all: isBoolean,
    channel: createOptionalGuard(createArrayGuard<Channel>(isChannel))
})

function getArgs(): Args {
    const options: ParseArgsOptionsConfig = {
        all: {
            type: 'boolean',
            short: 'a',
            default: false,
        },
        channel: {
            type: 'string',
            short: 'c',
            multiple: true,
        },
    }
    const { values } = parseArgs({ options })
    if (!isArgs(values)) exitWith('Invalid arguments')
    return values
}

function fmtMkdContent(changeLog: ChangeLog): string {
    return `What's Changed\n\n` + changeLog.changes.map(line => `- ${line}`).join('\n')
}

async function completeAll() {
    const entries = parseChangelog()
    console.log(`Parsed ${entries.length} changelog entries`)
    const map = new Map<string, ChangeLog>()
    for (const entry of entries) {
        map.set(entry.version, entry)
    }

    // 1. Firefox
    const allVersions = await listFirefoxVersions()
    console.log(`Found ${allVersions.length} Firefox versions`)
    for (const { version, release_notes: exist } of allVersions) {
        const entry = map.get(version)
        if (!entry) {
            console.log(`No changelog entry found for version ${version}`)
            continue
        }
        // exist already
        if (exist?.['en-US']) continue
        await updateFirefoxReleaseNote(version, fmtMkdContent(entry))
        console.log(`Completed Firefox release note for version ${version}`)
    }
}

async function updateCurrent(channel: Channel[]) {
    const entries = parseChangelog()
    console.log(`Completing current changelog entries for channels: ${channel.join(', ')}`)
    const currEntry = entries.find(e => e.version === current)
    if (!currEntry) exitWith(`No current changelog entry found: ${current}`)

    if (channel.includes('firefox')) {
        await updateFirefoxReleaseNote(current, fmtMkdContent(currEntry))
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const { all, channel } = getArgs()
    if (all) {
        completeAll()
    } else if (channel?.length) {
        updateCurrent(channel)
    } else {
        exitWith('No arguments provided')
    }
}