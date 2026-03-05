import hash from 'hash.js'
import type { NotificationData, NotificationMeta, NotificationRequest, Notifier } from '../types'

function buildHeaders(meta: NotificationMeta, token: string | undefined): Record<string, string> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    }
    if (token) {
        const sign = genSign(meta, token)
        headers['Tt4b-Sign'] = sign
    }
    return headers
}

function genSign(meta: NotificationMeta, auth: string): string {
    return hash.hmac(hash.sha256 as any, auth).update(meta).digest('hex')
}

export default class CallbackNotifier implements Notifier {
    async send(req: NotificationRequest, data: NotificationData): Promise<string | undefined> {
        const { endpoint, authToken } = req

        if (!endpoint) return "Endpoint is required for HTTP callback"

        try {
            const url = new URL(endpoint)
            if (!['http:', 'https:'].includes(url.protocol)) {
                return "Endpoint must use HTTP or HTTPS protocol"
            }
        } catch (e) {
            return "Invalid endpoint URL"
        }

        const { meta } = data
        const headers = buildHeaders(meta, authToken)

        const response = await fetch(endpoint, {
            method: 'POST', headers,
            body: JSON.stringify(data),
        })

        return response.ok ? undefined : `Server error: ${response.statusText}`
    }
}
