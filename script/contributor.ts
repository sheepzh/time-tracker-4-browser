import { createGist, findTarget, updateGist, type FileForm, type GistForm } from '@api/gist'
import { writeFileSync } from 'fs'
import { createArrayGuard, createObjectGuard, isInt, isString } from 'typescript-guard'
import { getClientFromEnv, TopMember } from './crowdin/client'
import { validateTokenFromEnv } from './util/gist'
import { exitWith } from './util/process'

type GithubContributor = {
    login: string
    avatar_url: string
    contributions: number
    type: string
}

const isGithubContributors = createArrayGuard(
    createObjectGuard<GithubContributor>({
        login: isString,
        avatar_url: isString,
        contributions: isInt,
        type: isString,
    })
)

async function fetchGithubContributors(token: string): Promise<GithubContributor[]> {
    const result: GithubContributor[] = []
    let page = 1
    while (true) {
        const res = await fetch(
            `https://api.github.com/repos/sheepzh/time-tracker-4-browser/contributors?per_page=100&page=${page}`,
            { headers: { Accept: 'application/vnd.github+json', Authorization: `token ${token}` } }
        )
        if (!res.ok) throw new Error(`GitHub contributors API error: ${res.status}`)
        const data = await res.json()
        if (!isGithubContributors(data)) exitWith(`Invalid data from GitHub API: ${JSON.stringify(data)}`)
        if (!data.length) break
        result.push(...data)
        page++
    }
    return result
}

const AVATAR_R = 20
const CARD_W = 64
const CARD_H = 76
const COLS = 12
const H_PADDING = 20
const V_PADDING = 16
const SECTION_GAP = 28
const SECTION_LABEL_H = 24

async function getBase64Avatar(url: string): Promise<string> {
    try {
        const response = await fetch(url)
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        const contentType = response.headers.get('content-type') ?? 'image/jpeg'
        const base64 = buffer.toString('base64')

        return `data:${contentType};base64,${base64}`
    } catch (error) {
        // Fallback to original URL if error occurs
        console.error(`[Avatar Fetch Failed] ${url}:`, error)
        return url
    }
}

type Contributor = {
    name: string
    avatarUrl: string
    sub: string
}

function renderCard(x: number, y: number, contributor: Contributor): string {
    const { avatarUrl, name, sub } = contributor
    const cx = x + CARD_W / 2
    const ay = y + AVATAR_R + 4

    const shortName = name.length > 8 ? name.slice(0, 7) + '…' : name
    const shortSub = sub.length > 10 ? sub.slice(0, 9) + '…' : sub
    const safeAvatarUrl = avatarUrl.replace(/&/g, '&amp;')

    return `
        <clipPath id="clip-${cx}-${ay}">
            <circle cx="${cx}" cy="${ay}" r="${AVATAR_R}" />
        </clipPath>
        <image
            href="${safeAvatarUrl}" xlink:href="${safeAvatarUrl}"
            x="${cx - AVATAR_R}" y="${ay - AVATAR_R}"
            width="${AVATAR_R * 2}" height="${AVATAR_R * 2}"
            clip-path="url(#clip-${cx}-${ay})" preserveAspectRatio="xMidYMid slice" 
        />
        <text
            x="${cx}" y="${ay + AVATAR_R + 13}" text-anchor="middle"  
            font-family="system-ui,sans-serif" font-size="10" fill="#24292f"
        >
            ${shortName}
        </text>
        <text 
            x="${cx}" y="${ay + AVATAR_R + 24}" text-anchor="middle"
            font-family="system-ui,sans-serif" font-size="8.5" fill="#57606a"
        >
            ${shortSub}
        </text>
    `
}

function renderSection(label: string, items: Contributor[], yOffset: number): { svg: string; height: number } {
    const rows = Math.ceil(items.length / COLS)
    const height = SECTION_LABEL_H + rows * CARD_H
    let svg = `
        <text
            x="${H_PADDING}" y="${yOffset + 18}"
            font-family="system-ui,sans-serif" font-size="13" font-weight="600" fill="#57606a"
        >
            ${label}
        </text>
    `

    items.forEach((item, i) => {
        const x = H_PADDING + (i % COLS) * CARD_W
        const y = yOffset + SECTION_LABEL_H + Math.floor(i / COLS) * CARD_H
        svg += renderCard(x, y, item)
    })
    return { svg, height }
}

async function renderSvg(coders: Contributor[], translators: Contributor[]): Promise<string> {
    const totalWidth = H_PADDING * 2 + COLS * CARD_W
    let y = V_PADDING
    const sections: string[] = []

    // Code Contributors
    for (const coder of coders) {
        coder.avatarUrl = await getBase64Avatar(coder.avatarUrl)
    }
    const { height: coderHeight, svg: coderSvg } = renderSection('Code Contributors', coders, y)
    sections.push(coderSvg)
    y += coderHeight + SECTION_GAP

    // Translation Contributors
    for (const translator of translators) {
        translator.avatarUrl = await getBase64Avatar(translator.avatarUrl)
    }
    const cdSection = renderSection('Translation Contributors', translators, y)
    sections.push(cdSection.svg)
    y += cdSection.height + V_PADDING

    const totalHeight = y

    return `
        <svg 
            xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
            width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}"
        >
            <rect width="${totalWidth}" height="${totalHeight}" fill="#ffffff" rx="8"/>
            ${sections.join('\n')}
        </svg>
    `
}

const GIST_DESC = 'Timer contributor list, auto-generated'
const GIST_FILENAME = 'contributors.svg'

async function uploadToGist(token: string, svg: string): Promise<void> {
    const files: Record<string, FileForm> = {
        [GIST_FILENAME]: { filename: GIST_FILENAME, content: svg },
    }
    const form: GistForm = { public: true, description: GIST_DESC, files }
    const existing = await findTarget(token, g => g.description === GIST_DESC)
    if (existing) {
        await updateGist(token, existing.id, form)
        console.log('Updated gist:', existing.id)
    } else {
        const created = await createGist(token, form)
        console.log('Created gist:', created.id)
    }
}

async function fetchCoders(token: string): Promise<Contributor[]> {
    console.log('Fetching GitHub contributors...')
    const github = await fetchGithubContributors(token)
    const users = github.filter(c => c.type === 'User')
    console.log(`GitHub: ${users.length} users (${github.length} contributors)`)

    return users.map(g => ({
        name: g.login,
        avatarUrl: g.avatar_url,
        sub: `${g.contributions} commits`
    }))
}

const crowdinScore = ({ approved, translated }: TopMember): number => translated + approved * .4

const LANGUAGE_MAP: Record<string, string> = {
    "Chinese Simplified": "简体中文",
    "Chinese Traditional": "正體中文",
}

const fetchTranslators = async (): Promise<Contributor[]> => {
    console.log('Fetching Crowdin contributors...')
    const members = await getClientFromEnv().fetchTopMembers()
    console.log(`Crowdin: ${members.length} contributors`)

    return members
        .filter(c => c.username !== 'sheepzh')
        .sort((a, b) => crowdinScore(b) - crowdinScore(a))
        .map(c => ({
            name: c.username,
            avatarUrl: c.avatarUrl,
            sub: c.languages.map(l => LANGUAGE_MAP[l] ?? l).slice(0, 1).join(', ')
        }))
}

async function main(): Promise<void> {
    const gistToken = validateTokenFromEnv()

    const coders = await fetchCoders(gistToken)
    const translators = await fetchTranslators()

    console.log('Rendering SVG...')
    const svg = await renderSvg(coders, translators)
    writeFileSync('contributors.svg', svg, 'utf-8')

    console.log('Uploading to Gist...')
    await uploadToGist(gistToken, svg)
    console.log('Done!')
}

main()

