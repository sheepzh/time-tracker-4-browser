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


class Handler {
    private readonly req: IncomingMessage
    private readonly res: ServerResponse
    private readonly origin: string
    private readonly url: URL

    constructor(req: IncomingMessage, res: ServerResponse) {
        this.req = req
        this.res = res
        this.origin = `http://${req.headers.host ?? `localhost:${PORT}`}`
        this.url = new URL(req.url ?? "/", this.origin)
    }

    handle() {
        try {
            const { method, url, headers } = this.req
            console.log(`${method} ${url} ${headers.authorization}`)

            if (!this.isAuthValid()) return this.unauthorized()

            if (method === "HEAD") return this.sendNoContent()
            const { pathname } = this.url
            if (method === "GET" && pathname === "/gists") return this.listGists()
            if (method === "POST" && pathname === "/gists") return this.createGist()

            const gistMatch = pathname.match(/^\/gists\/([^/]+)$/)
            if (gistMatch?.[1]) {
                const gistId = gistMatch[1]
                if (method === "GET") return this.getGist(gistId)
                if (method === "POST") return this.updateGist(gistId)
                if (method === "PATCH") return this.updateGist(gistId)
                if (method === "DELETE") return this.deleteGist(gistId)
            }

            const rawMatch = pathname.match(/^\/raw\/([^/]+)\/(.+)$/)
            if (method === "GET" && rawMatch?.[1] && rawMatch?.[2]) {
                const gistId = rawMatch[1]
                const filename = decodeURIComponent(rawMatch[2])
                return this.getRawFile(gistId, filename)
            }

            return this.notFound()
        } catch (e) {
            console.error("Mock gist server error:", e)
            this.sendJson(400, { message: "Bad Request" })
        }
    }

    private isAuthValid(): boolean {
        const { method, headers: { authorization } } = this.req
        const needAuth = method === "GET" || method === "POST" || method === "PATCH" || method === "DELETE"
        if (!needAuth) return true
        return !REQUIRED_TOKEN || `token ${REQUIRED_TOKEN}` === authorization
    }

    private async readBody<T>(): Promise<T> {
        const body = await new Promise<string>((resolve, reject) => {
            let data = ""
            this.req.on("data", (chunk: Buffer) => { data += chunk.toString() })
            this.req.on("end", () => resolve(data))
            this.req.on("error", reject)
        })
        return JSON.parse(body) as T
    }

    private listGists() {
        const perPageRaw = Number(this.url.searchParams.get("per_page") || "30")
        const pageRaw = Number(this.url.searchParams.get("page") || "1")
        const perPage = Math.min(100, Math.max(1, Number.isNaN(perPageRaw) ? 30 : perPageRaw))
        const page = Math.max(1, Number.isNaN(pageRaw) ? 1 : pageRaw)
        const since = this.url.searchParams.get("since")
        const all = gistOrder.map(id => gists.get(id)).filter(Boolean) as Gist[]
        const filtered = since
            ? all.filter(gist => gist.updated_at > since)
            : all
        const start = (page - 1) * perPage
        const end = start + Math.max(0, perPage)
        this.sendJson(200, filtered.slice(start, end))
    }

    private async createGist() {
        const form = await this.readBody<GistForm>()
        if (!form.files || Object.keys(form.files).length === 0) {
            return this.validationFailed("Validation failed: files is required")
        }
        const gist = buildCreatedGist(this.origin, form)
        gists.set(gist.id, gist)
        gistOrder.unshift(gist.id)
        this.sendJson(201, gist)
    }

    private getGist(gistId: string) {
        const gist = gists.get(gistId)
        if (!gist) return this.notFound()
        this.sendJson(200, gist)
    }

    private async updateGist(gistId: string) {
        const gist = gists.get(gistId)
        if (!gist) return this.notFound()
        const form = await this.readBody<GistForm>()
        if (!form.description && !form.files) {
            return this.validationFailed("Validation failed: description or files is required")
        }
        const updated = updateExistingGist(this.origin, gist, form)
        gists.set(gistId, updated)
        this.sendJson(200, updated)
    }

    private async deleteGist(gistId: string) {
        if (!gists.has(gistId)) return this.notFound()
        gists.delete(gistId)
        const idx = gistOrder.findIndex(id => id === gistId)
        if (idx >= 0) gistOrder.splice(idx, 1)
        this.sendNoContent()
    }

    private getRawFile(gistId: string, filename: string) {
        const gist = gists.get(gistId)
        const file = gist?.files[filename]
        if (!file) return this.notFound()
        this.res.writeHead(200, { "Content-Type": file.type || "text/plain" })
        this.res.end(file.content || "")
    }

    private sendJson(statusCode: number, payload: unknown) {
        this.res.writeHead(statusCode, { "Content-Type": "application/json" })
        this.res.end(JSON.stringify(payload))
    }

    private unauthorized() {
        this.sendJson(401, { message: "Bad credentials" })
    }

    private sendNoContent() {
        this.res.writeHead(204).end()
    }

    private validationFailed(message: string) {
        this.sendJson(422, { message })
    }

    private notFound() {
        this.sendJson(404, { message: "Not Found" })
    }
}

function main() {
    const server = createServer((req, res) => new Handler(req, res).handle())

    server.listen(PORT, () => {
        console.log(`Gist mock server listening on http://localhost:${PORT}`)
        console.log("Set GIST_TOKEN to enable token validation")
    })
}

main()
