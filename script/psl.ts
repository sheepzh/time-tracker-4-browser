/**
 * Build psl tree
 */
import { fetchGet } from '@api/http'
import { type PslTree } from '@util/psl'
import { writeFileSync } from 'fs'
import path from 'path'
import punycode from "punycode"

const LIST_URL = "https://publicsuffix.org/list/effective_tld_names.dat"
const JSON_PATH = path.join(__dirname, "..", "src", "util", "psl", "rules.json")

const downloadList = async (): Promise<string> => {
    const response = await fetchGet(LIST_URL)
    return response.text()
}

const parse = (tree: PslTree, parts: string[], index: number) => {
    if (index < 0) return
    const part = parts[index]
    const ascii = punycode.toASCII(part)
    let node = tree[ascii]
    if (index === 0) {
        if (!node) tree[ascii] = 1
        if (typeof node === "object") node.l = 1
    } else {
        if (!node) tree[ascii] = node = { c: {} } satisfies PslTree
        if (node === 1) tree[ascii] = node = { c: {}, l: 1 }
        const subTree = (node as PslTree).c as PslTree
        parse(subTree, parts, index - 1)
    }
}

const sortByKey = (tree: PslTree): PslTree => {
    if (!tree) return tree
    const newTree: PslTree = {}
    Object.entries(tree)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .forEach(([k, v]) => newTree[k] = typeof v === 'number' ? v : sortByKey(v))
    return newTree
}

async function main() {
    const list = await downloadList()
    const lines = list.split("\n")
        .filter(l => !l.startsWith("//"))
        .map(l => l.trim())
        .filter(l => !!l)
    let tree: PslTree = {}
    lines.forEach(line => {
        const parts = line.split('.')
        parse(tree, parts, parts.length - 1)
        console.log("Parsed " + line)
    })

    tree = sortByKey(tree)

    writeFileSync(JSON_PATH, JSON.stringify(tree, null, 4), { encoding: "utf-8" })
}



main()