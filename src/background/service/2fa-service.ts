/**
 * 2FA service implementation
 * https://datatracker.ietf.org/doc/html/rfc6238
 *
 * Copyright (c) 2026 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { getRuntimeName } from '@api/chrome/runtime'
import db from '@db/meta-database'
import { decodeBase32, decodeBase64, encodeBase32, encodeBase64 } from '@util/encode'
import { getCid } from './meta-service'

/**
 * Generate TOTP material and save to the storage
 *
 * @return otpauth URI
 */
export async function prepare2fa(): Promise<string> {
    const secret = generateSecret()
    const issuer = getRuntimeName()
    const accountName = await getCid()
    const uri = buildTotpUri({ issuer, accountName, secret })
    await saveTwoFa(secret)
    return uri
}

function generateSecret(): string {
    const randomBytes = new Uint8Array(20)
    crypto.getRandomValues(randomBytes)
    return encodeBase32(randomBytes).toLowerCase()
}

function buildTotpUri(params: { issuer: string; accountName: string; secret: string }): string {
    const { issuer, accountName, secret } = params
    const label = `${issuer}:${accountName}`
    const sec = secret.toUpperCase().replace(/\s/g, '')
    return `otpauth://totp/${encodeURIComponent(label)}?secret=${sec}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`
}

async function saveTwoFa(secret: string): Promise<void> {
    const cid = await getCid()
    const meta = await db.getMeta()
    meta.twoFa = await encrypt(secret, cid)
    await db.update(meta)
}

async function encrypt(plaintext: string, cid: string): Promise<timer.TwoFactorAuth> {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(plaintext)

    const salt = crypto.getRandomValues(new Uint8Array(16))
    const iv = crypto.getRandomValues(new Uint8Array(12))

    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(cid),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    )

    const key = await crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    )

    const cipherText = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        dataBuffer
    )

    return {
        salt: encodeBase64(salt),
        iv: encodeBase64(iv),
        secret: encodeBase64(new Uint8Array(cipherText)),
    }
}

export async function check2faCode(code: string): Promise<boolean> {
    const { twoFa } = await db.getMeta()
    if (!twoFa) return false

    const cid = await getCid()
    const secret = await decryptSecret(twoFa, cid)
    return verifyTotp(secret, code)
}

async function decryptSecret(twoFa: timer.TwoFactorAuth, cid: string): Promise<string> {
    const encoder = new TextEncoder()
    const keyMaterial = await crypto.subtle.importKey(
        'raw', encoder.encode(cid), { name: 'PBKDF2' }, false, ['deriveKey']
    )
    const key = await crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: decodeBase64(twoFa.salt), iterations: 100000, hash: 'SHA-256' },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
    )
    const plain = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: decodeBase64(twoFa.iv) },
        key,
        decodeBase64(twoFa.secret),
    )
    return new TextDecoder().decode(plain)
}

async function verifyTotp(secretBase32: string, code: string): Promise<boolean> {
    const normalized = code.replace(/\s/g, '')
    if (!/^\d{6}$/.test(normalized)) return false
    const step = Math.floor(Date.now() / 1000 / 30)
    for (const delta of [0, -1, 1]) {
        const candidate = await genTotp(secretBase32, step + delta)
        if (candidate === normalized) return true
    }
    return false
}

async function genTotp(secretBase32: string, step: number): Promise<string> {
    const key = decodeBase32(secretBase32)
    const msg = new Uint8Array(8)
    let t = step
    for (let i = 7; i >= 0; i--) {
        msg[i] = t & 0xff
        t >>>= 8
    }

    const hmacKey = await crypto.subtle.importKey(
        'raw', key.slice(), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']
    )
    const sigBuffer = await crypto.subtle.sign('HMAC', hmacKey, msg)
    const sig = new Uint8Array(sigBuffer)
    const offset = sig[sig.length - 1]! & 0x0f
    const otp = ((sig[offset]! & 0x7f) << 24
        | sig[offset + 1]! << 16
        | sig[offset + 2]! << 8
        | sig[offset + 3]!) % 1_000_000
    return otp.toString().padStart(6, '0')
}
