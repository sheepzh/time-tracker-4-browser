import { randomUUID } from "crypto"
import { createServer, type IncomingMessage, type ServerResponse } from "http"

type GistFormFile = {
    filename: string
    content: string
}

type GistFile = {
    filename: string
    type: string
    language: string
    raw_url: string
    size: number
    truncated: boolean
    content?: string
}

type GistForm = Partial<{
    public: boolean
    description: string
    files: { [filename: string]: GistFormFile | null }
}>

type Gist = {
    url: string
    forks_url: string
    commits_url: string
    id: string
    node_id: string
    git_pull_url: string
    git_push_url: string
    html_url: string
    public: boolean
    description: string
    files: { [filename: string]: GistFile | null }
    comments: number
    comments_url: string
    owner: null
    user: null
    truncated: boolean
    history: unknown[]
    forks: unknown[]
    created_at: string
    updated_at: string
}

const PORT = Number(process.env.PORT ?? 12347)
// The same as e2e tests
const REQUIRED_TOKEN = 'github_gist_mock_token'

const gists = new Map<string, Gist>()
const gistOrder: string[] = []

function nowIso(): string {
    return new Date().toISOString()
}

function inferFileType(filename: string): string {
    if (filename.endsWith(".json")) return "application/json"
    if (filename.endsWith(".md")) return "text/markdown"
    return "text/plain"
}

function inferLanguage(filename: string): string {
    if (filename.endsWith(".json")) return "JSON"
    if (filename.endsWith(".md")) return "Markdown"
    return "Text"
}

function sendJson(res: ServerResponse, statusCode: number, payload: unknown) {
    res.writeHead(statusCode, { "Content-Type": "application/json" })
    res.end(JSON.stringify(payload))
}

function sendNoContent(res: ServerResponse) {
    res.writeHead(204).end()
}

function getOrigin(req: IncomingMessage): string {
    const host = req.headers.host || `localhost:${PORT}`
    return `http://${host}`
}

async function readBody<T>(req: IncomingMessage): Promise<T> {
    const body = await new Promise<string>((resolve, reject) => {
        let data = ""
        req.on("data", (chunk: Buffer) => { data += chunk.toString() })
        req.on("end", () => resolve(data))
        req.on("error", reject)
    })
    return JSON.parse(body) as T
}

function isAuthed(req: IncomingMessage): boolean {
    if (!REQUIRED_TOKEN) return true
    const auth = req.headers.authorization || ""
    return auth === `token ${REQUIRED_TOKEN}` || auth === `Bearer ${REQUIRED_TOKEN}`
}

function buildGistFile(origin: string, gistId: string, filename: string, content: string): GistFile {
    const encodedFilename = encodeURIComponent(filename)
    return {
        filename,
        type: inferFileType(filename),
        language: inferLanguage(filename),
        raw_url: `${origin}/raw/${gistId}/${encodedFilename}`,
        size: Buffer.byteLength(content, "utf-8"),
        truncated: false,
        content,
    }
}

function buildCreatedGist(origin: string, form: GistForm): Gist {
    const id = randomUUID().replaceAll("-", "")
    const ts = nowIso()
    const files: Record<string, GistFile> = {}
    for (const [filename, file] of Object.entries(form.files || {})) {
        if (!file) continue
        files[filename] = buildGistFile(origin, id, filename, file.content)
    }
    const gistUrl = `${origin}/gists/${id}`
    return {
        url: gistUrl,
        forks_url: `${gistUrl}/forks`,
        commits_url: `${gistUrl}/commits`,
        id,
        node_id: `MOCK_${id}`,
        git_pull_url: `${origin}/${id}.git`,
        git_push_url: `${origin}/${id}.git`,
        html_url: `${origin}/mock/gist/${id}`,
        public: !!form.public,
        description: form.description ?? "",
        files,
        comments: 0,
        comments_url: `${gistUrl}/comments`,
        owner: null,
        user: null,
        truncated: false,
        history: [],
        forks: [],
        created_at: ts,
        updated_at: ts,
    }
}

function updateExistingGist(origin: string, gist: Gist, form: GistForm): Gist {
    const next: Gist = {
        ...gist,
        description: form.description ?? gist.description,
        public: typeof form.public === "boolean" ? form.public : gist.public,
        files: { ...gist.files },
        updated_at: nowIso(),
    }
    for (const [filename, file] of Object.entries(form.files || {})) {
        if (file === null) {
            delete next.files[filename]
            continue
        }
        const oldFilename = filename
        const newFilename = file.filename || oldFilename
        if (newFilename !== oldFilename) {
            delete next.files[oldFilename]
        }
        next.files[newFilename] = buildGistFile(origin, gist.id, newFilename, file.content)
    }
    return next
}

function notFound(res: ServerResponse) {
    sendJson(res, 404, { message: "Not Found" })
}

function unauthorized(res: ServerResponse) {
    sendJson(res, 401, { message: "Bad credentials" })
}

function validationFailed(res: ServerResponse, message: string) {
    sendJson(res, 422, { message })
}

function listGists(req: IncomingMessage, res: ServerResponse) {
    const url = new URL(req.url || "/", getOrigin(req))
    const perPageRaw = Number(url.searchParams.get("per_page") || "30")
    const pageRaw = Number(url.searchParams.get("page") || "1")
    const perPage = Math.min(100, Math.max(1, Number.isNaN(perPageRaw) ? 30 : perPageRaw))
    const page = Math.max(1, Number.isNaN(pageRaw) ? 1 : pageRaw)
    const since = url.searchParams.get("since")
    const all = gistOrder.map(id => gists.get(id)).filter(Boolean) as Gist[]
    const filtered = since
        ? all.filter(gist => gist.updated_at > since)
        : all
    const start = (page - 1) * perPage
    const end = start + Math.max(0, perPage)
    sendJson(res, 200, filtered.slice(start, end))
}

async function handleCreateGist(req: IncomingMessage, res: ServerResponse) {
    const form = await readBody<GistForm>(req)
    if (!form.files || Object.keys(form.files).length === 0) {
        return validationFailed(res, "Validation failed: files is required")
    }
    const origin = getOrigin(req)
    const gist = buildCreatedGist(origin, form)
    gists.set(gist.id, gist)
    gistOrder.unshift(gist.id)
    sendJson(res, 201, gist)
}

function handleGetGist(req: IncomingMessage, res: ServerResponse, gistId: string) {
    const gist = gists.get(gistId)
    if (!gist) return notFound(res)
    sendJson(res, 200, gist)
}

async function handleUpdateGist(req: IncomingMessage, res: ServerResponse, gistId: string) {
    const gist = gists.get(gistId)
    if (!gist) return notFound(res)
    const form = await readBody<GistForm>(req)
    if (!form.description && !form.files) {
        return validationFailed(res, "Validation failed: description or files is required")
    }
    const updated = updateExistingGist(getOrigin(req), gist, form)
    gists.set(gistId, updated)
    sendJson(res, 200, updated)
}

function handleDeleteGist(res: ServerResponse, gistId: string) {
    if (!gists.has(gistId)) return notFound(res)
    gists.delete(gistId)
    const idx = gistOrder.findIndex(id => id === gistId)
    if (idx >= 0) gistOrder.splice(idx, 1)
    sendNoContent(res)
}

function handleRawFile(res: ServerResponse, gistId: string, filename: string) {
    const gist = gists.get(gistId)
    const file = gist?.files[filename]
    if (!file) return notFound(res)
    res.writeHead(200, { "Content-Type": file.type || "text/plain" })
    res.end(file.content || "")
}

function main() {
    const server = createServer(async (req, res) => {
        try {
            const needAuth = req.method === "GET" || req.method === "POST" || req.method === "PATCH" || req.method === "DELETE"
            if (needAuth && !isAuthed(req)) {
                return unauthorized(res)
            }

            if (req.method === "HEAD") {
                res.writeHead(200).end()
                return
            }

            const origin = getOrigin(req)
            const parsed = new URL(req.url || "/", origin)
            const pathname = parsed.pathname

            if (req.method === "GET" && pathname === "/gists") {
                return listGists(req, res)
            }

            if (req.method === "POST" && pathname === "/gists") {
                return await handleCreateGist(req, res)
            }

            const gistMatch = pathname.match(/^\/gists\/([^/]+)$/)
            if (gistMatch?.[1]) {
                const gistId = gistMatch[1]
                if (req.method === "GET") return handleGetGist(req, res, gistId)
                if (req.method === "POST") return await handleUpdateGist(req, res, gistId)
                if (req.method === "PATCH") return await handleUpdateGist(req, res, gistId)
                if (req.method === "DELETE") return handleDeleteGist(res, gistId)
            }

            const rawMatch = pathname.match(/^\/raw\/([^/]+)\/(.+)$/)
            if (req.method === "GET" && rawMatch?.[1] && rawMatch?.[2]) {
                const gistId = rawMatch[1]
                const filename = decodeURIComponent(rawMatch[2])
                return handleRawFile(res, gistId, filename)
            }

            return notFound(res)
        } catch (e) {
            console.error("Mock gist server error:", e)
            sendJson(res, 400, { message: "Bad Request" })
        }
    })

    server.listen(PORT, () => {
        console.log(`Gist mock server listening on http://localhost:${PORT}`)
        console.log("Set GIST_TOKEN to enable token validation")
    })
}

main()
