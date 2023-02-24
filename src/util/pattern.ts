/**
 * Copyright (c) 2021 Hengyang Zhang
 * 
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { SUFFIX_HOST_MAP } from "./constant/remain-host"

/**
 * Test whether the url belongs to the browser
 * 
 * @param url 
 */
export function isBrowserUrl(url: string) {
    return /^chrome.*?:\/\/.*$/.test(url)
        || /^about(-.+)?:/.test(url)
        // Firefox addons' pages
        || /^moz-extension:/.test(url)
        || /^edge.*?:\/\/.*$/.test(url)
        // Edge extensions' pages
        || /^extension:/.test(url)
        || /^safari.*?:\/\/.*/.test(url)
}

const isNotValidPort = (portStr: string) => {
    const port = parseInt(portStr)
    return port < 0 || port > 65535 || port.toString() !== portStr
}

/**
 * Test whether the host is ip or ip and port
 * 
 * @param host 
 */
export function isIpAndPort(host: string) {
    host = host.trim()
    const indexOfColon = host.indexOf(':')
    if (indexOfColon > 0) {
        const portStr = host.substring(indexOfColon + 1)
        if (isNotValidPort(portStr)) {
            return false
        }
        host = host.substring(0, indexOfColon)
    }
    const reg = /^(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9])\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9]|0)\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9]|0)\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[0-9])$/
    return reg.test(host)
}

/**
 * Test whether the host is a valid host
 * 
 * @param host 
 */
export function isValidHost(host: string) {
    const indexOfColon = host.indexOf(':')
    if (indexOfColon > -1) {
        const portStr = host.substring(indexOfColon + 1)
        if (portStr !== '*' && isNotValidPort(portStr)) {
            return false
        }
        host = host.substring(0, indexOfColon)
    }
    const reg = /^((\*|([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9]))\.)*(\*|([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9]))$/
    return reg.test(host)
}

export type HostInfo = {
    /**
     * Including port
     */
    host: string
    protocol: string
}

export function extractHostname(url: string): HostInfo {
    let fileHost = extractFileHost(url)
    if (fileHost) {
        return { host: fileHost, protocol: 'file' }
    }

    let host: string
    let protocol: string
    const indexOfDoubleSlashes = url.indexOf("//")
    if (indexOfDoubleSlashes > -1) {
        const splits = url.split('/')
        host = splits[2]
        protocol = splits[0]
        protocol = protocol.substring(0, protocol.length - 1)
    } else {
        host = url.split('/')[0]
        protocol = ''
    }
    host = host.split('?')[0]

    return { host, protocol }
}

/**
 * @since 0.7.0
 */
export function extractFileHost(url: string): string {
    url = url?.trim?.()
    if (!url) {
        return undefined
    }
    if (!url.startsWith("file://")) {
        return undefined
    }
    const dotIdx = url.lastIndexOf(".")
    if (dotIdx < 0) {
        return undefined
    }
    const suffix = url.substring(dotIdx + 1).toLowerCase()
    return suffix ? SUFFIX_HOST_MAP[suffix] : undefined
}

/**
 * Judge whether homepage 
 * e.g.
 *  1. https://baidu.com/  =  true
 *  2. http://baidu.com    =  true
 *  3. www.baidu.com       =  true
 *  4. https://baidu.com/a =  false
 *  5. http://qq.com?a=1   =  false
 * 
 * @since 0.5.0
 */
export function isHomepage(url: string) {
    if (url.includes('?') || url.includes('#')) {
        return false
    }
    const indexOfDoubleSlashes = url.indexOf("//")
    let hostStr = url
    if (indexOfDoubleSlashes > -1) {
        hostStr = url.substring(indexOfDoubleSlashes + 2)
    }
    const indexOfSlash = hostStr.indexOf("/")
    return indexOfSlash < 0 || indexOfSlash === hostStr.length - 1
}
