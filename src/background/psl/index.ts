import { toASCII } from "punycode"
import rules from "./rules.json"

export type PslNode = {
    // Children <part>
    c?: PslTree
    // Is leaf
    l?: number
}

export type PslTree = Record<string, PslNode | number>

const TREE: PslTree = rules

type Chain = string | [string, boolean]

export const getPslSuffix = (origin: string): string => {
    if (!origin) return origin
    const ascii = toASCII(origin)
    const parts = ascii.split(".")
    const chains: Chain[] = []
    get0(TREE, parts, parts.length - 1, chains)
    let idx = -1
    chains.forEach((c, i) => (typeof c === "string" || c[1]) && (idx = i))
    const partLen = idx + 1
    return parts.splice(parts.length - partLen, partLen).join('.')
}

export const getPsl = (origin: string): string | null => {
    if (!origin) return origin
    const ascii = toASCII(origin)
    const parts = ascii.split(".")
    const chains: Chain[] = []
    get0(TREE, parts, parts.length - 1, chains)
    let idx = -1
    chains.forEach((c, i) => (typeof c === "string" || c[1]) && (idx = i))
    const partLen = idx + 2
    return parts.splice(parts.length - partLen, partLen).join('.')
}

const get0 = (tree: PslTree, parts: string[], index: number, chains: Chain[]) => {
    const part = parts[index]
    let pslNode = tree[part]
    if (!pslNode && !tree[`!${part}`]) {
        pslNode = tree['*']
    }
    if (!pslNode) {
        return
    } else if (pslNode === 1) {
        chains.push(part)
    } else {
        const { l, c } = pslNode as PslNode
        chains.push(l ? part : [part, false])
        c && get0(c, parts, index - 1, chains)
    }
}
