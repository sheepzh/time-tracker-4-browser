import { IS_FIREFOX } from '@util/constant/environment'
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
    private async assertPerm(): Promise<string | undefined> {
        // Not need to check data permission if not FF
        if (!IS_FIREFOX) return undefined

        const perm = await browser?.permissions?.getAll?.()
        const granted = perm?.data_collection?.includes?.('technicalAndInteraction')
        if (!granted) {
            // Unable to request permissions in FF's Service Worker
            // So fast fail
            return "Required permission is not granted"
        }
    }

    async send(req: NotificationRequest, data: NotificationData): Promise<string | undefined> {
        const errMsg = await this.assertPerm()
        if (errMsg) return errMsg

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
