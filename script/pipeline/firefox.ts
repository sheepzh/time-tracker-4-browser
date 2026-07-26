import jwt from 'jsonwebtoken'
import { createArrayGuard, createNullableGuard, createObjectGuard, createRecordGuard, isInt, isString } from 'typescript-guard'
import { fileURLToPath } from 'url'
import Throttler from '../util/throttler'

const GUID = '{a8cf72f7-09b7-4cd4-9aaa-7a023bf09916}'
const BASE_URL = `https://addons.mozilla.org/api/v5/addons/addon/${GUID}`

function generateJwtToken(): string {
    const iss = process.env.FIREFOX_JWD_ISSUER
    const secret = process.env.FIREFOX_JWD_SECRET
    if (!iss) throw new Error('FIREFOX_JWD_ISSUER is not defined.')
    if (!secret) throw new Error('FIREFOX_JWD_SECRET is not defined.')

    const issuedAt = Math.floor(Date.now() / 1000) // Remove milliseconds.
    const payload = {
        exp: issuedAt + 5 * 60, // Set expiration time to 5 minutes.
        iat: issuedAt,
        iss,
        jti: Math.random().toString()
    }
    return jwt.sign(payload, secret, { algorithm: 'HS256' })
}

const TOKEN = generateJwtToken()
const HEADERS = { Authorization: `jwt ${TOKEN}` } as const
const THROTTLER = new Throttler(1, 1)

type Version = {
    id: number
    version: string
    release_notes: { [key: string]: string } | null
}

const isVersion = createObjectGuard<Version>({
    id: isInt,
    version: isString,
    release_notes: createNullableGuard(createRecordGuard(isString))
})

type VersionPage = {
    next: string | null
    results: Version[]
}

const isFirefoxPage = createObjectGuard<VersionPage>({
    next: createNullableGuard(isString),
    results: createArrayGuard(isVersion)
})

export async function listFirefoxVersions(): Promise<Version[]> {
    const pageSize = 100
    const versions: Version[] = []

    let url = `${BASE_URL}/versions/?page_size=${pageSize}&page=1`

    while (true) {
        await THROTTLER.acquire()
        const response = await fetch(url, { headers: HEADERS })
        const jsonResp = await response.json()
        if (!isFirefoxPage(jsonResp)) {
            console.log(JSON.stringify(jsonResp))
            throw new Error('Invalid Firefox page response.')
        }
        const { results, next } = jsonResp
        // remove unused fields
        for (const { id, release_notes, version } of results) {
            versions.push({ id, release_notes, version })
        }
        if (!next) return versions
        console.log(`Fetching next page: ${next}`)
        url = next
    }
}

export async function updateFirefoxReleaseNote(version: string, content: string) {
    const url = `${BASE_URL}/versions/${version}/`

    const headers = { ...HEADERS, 'Content-Type': 'application/json' }
    const body = {
        release_notes: { 'en-US': content }
    }

    await THROTTLER.acquire()
    const response = await fetch(url, { headers, method: 'PATCH', body: JSON.stringify(body) })
    const jsonResp = await response.json()
    if (!isVersion(jsonResp)) {
        console.log(JSON.stringify(jsonResp, null, 2))
        throw new Error('Errored to update Firefox version.')
    }
    console.log(`Success to update Firefox changelog v${version}: ${JSON.stringify(jsonResp.release_notes)}`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    // const versions = await listFirefoxVersions()
    // console.log(JSON.stringify(versions))
    // await updateFirefoxReleaseNote('4.4.4', 'Test')
}
