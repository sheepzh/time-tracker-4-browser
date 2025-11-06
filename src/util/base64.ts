const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

export function encode(str: string): string {
    const bytes = new TextEncoder().encode(str)
    let result = ''

    for (let i = 0; i < bytes.length; i += 3) {
        const byte1 = bytes[i]
        const byte2 = bytes[i + 1] || 0
        const byte3 = bytes[i + 2] || 0

        const char1 = byte1 >> 2
        const char2 = ((byte1 & 0x03) << 4) | (byte2 >> 4)
        const char3 = ((byte2 & 0x0F) << 2) | (byte3 >> 6)
        const char4 = byte3 & 0x3F

        result += BASE64_CHARS[char1] + BASE64_CHARS[char2] +
            (i + 1 < bytes.length ? BASE64_CHARS[char3] : '=') +
            (i + 2 < bytes.length ? BASE64_CHARS[char4] : '=')
    }

    return result
}