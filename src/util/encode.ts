const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export function encodeBase64(str: string | Uint8Array<ArrayBuffer>): string {
    const bytes = typeof str === 'string' ? new TextEncoder().encode(str) : str
    let result = ''

    for (let i = 0; i < bytes.length; i += 3) {
        const byte1 = bytes[i] ?? 0
        const byte2 = bytes[i + 1] ?? 0
        const byte3 = bytes[i + 2] ?? 0

        const char1 = byte1 >> 2
        const char2 = ((byte1 & 0x03) << 4) | (byte2 >> 4)
        const char3 = ((byte2 & 0x0F) << 2) | (byte3 >> 6)
        const char4 = byte3 & 0x3F

        result += BASE64_CHARS.charAt(char1) + BASE64_CHARS.charAt(char2) +
            (i + 1 < bytes.length ? BASE64_CHARS.charAt(char3) : '=') +
            (i + 2 < bytes.length ? BASE64_CHARS.charAt(char4) : '=')
    }

    return result
}

export function decodeBase64(base64: string): Uint8Array<ArrayBuffer> {
    const chars = BASE64_CHARS
    const len = base64.length

    let validLen = len
    while (validLen > 0 && base64[validLen - 1] === '=') validLen--

    const bytesLength = Math.floor(validLen * 3 / 4)
    const bytes = new Uint8Array(bytesLength)
    let byteIdx = 0
    let buffer = 0
    let bitsCollected = 0

    for (let i = 0; i < len; i++) {
        const c = base64[i]
        if (c === '=' || !c) break
        const idx = chars.indexOf(c)
        if (idx === -1) throw new Error('Invalid Base64 character')

        buffer = (buffer << 6) | idx
        bitsCollected += 6

        if (bitsCollected >= 8) {
            bitsCollected -= 8
            bytes[byteIdx++] = (buffer >> bitsCollected) & 0xff
        }
    }
    return bytes
}

export function encodeBase32(buffer: Uint8Array<ArrayBuffer>) {
    let result = ''
    let bits = 0
    let value = 0

    for (const byte of buffer) {
        value = (value << 8) | byte
        bits += 8
        while (bits >= 5) {
            bits -= 5
            result += BASE32_CHARS[(value >>> bits) & 0x1f]
        }
    }

    if (bits > 0) {
        result += BASE32_CHARS[(value << (5 - bits)) & 0x1f]
    }

    return result
}

export function decodeBase32(base32: string): Uint8Array<ArrayBuffer> {
    const str = base32.toUpperCase().replace(/=+$/, '')
    const bytes = new Uint8Array(Math.floor(str.length * 5 / 8))
    let buf = 0, bits = 0, idx = 0
    for (const c of str) {
        const v = BASE32_CHARS.indexOf(c)
        if (v === -1) continue
        buf = (buf << 5) | v
        bits += 5
        if (bits >= 8) { bits -= 8; bytes[idx++] = (buf >> bits) & 0xff }
    }
    return bytes
}