import hash from "hash.js"
import { createServer } from "http"

const AUTH: string | undefined = process.env.AUTH

function genSign(meta: any, auth: string): string {
    return hash.hmac(hash.sha256 as any, auth).update(meta).digest('hex')
}

function verifySign(meta: any, receivedSign: string | string[] | undefined): boolean {
    if (!AUTH) return true
    if (!receivedSign) return false
    return genSign(meta, AUTH) === receivedSign
}

function main() {
    const server = createServer(async (req, res) => {
        const method = req.method
        if (method === 'HEAD') {
            res.writeHead(200).end()
            return
        }

        if (method === 'POST') {
            try {
                const body = await new Promise<string>((resolve, reject) => {
                    let data = ''
                    req.on('data', (chunk: Buffer) => { data += chunk.toString() })
                    req.on('end', () => resolve(data))
                    req.on('error', reject)
                })

                const { meta } = JSON.parse(body)
                const sign = req.headers['tt4b-sign']
                if (!verifySign(meta, sign)) {
                    res.writeHead(401).end('Unauthorized')
                    return
                }

                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.end("Thanks!!")
            } catch (e) {
                console.error("Failed to parse request", e)
                res.writeHead(400).end('Bad Request')
            }
            return
        }

        res.writeHead(405).end('Method Not Allowed')
    })

    const port = 3000
    server.listen(port, () => console.log(`Notification server listening on port ${port}`))
}

main()
