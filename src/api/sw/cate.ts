/**
 * Cate domain: request to sw.
 */
import { sendMsg2Runtime } from "@api/chrome/runtime"

export function listCates() {
    return sendMsg2Runtime('cate.listAll')
}

export function addCate(name: string) {
    return sendMsg2Runtime('cate.add', name)
}

export function saveCateName(id: number, name: string) {
    return sendMsg2Runtime('cate.saveName', { id, name })
}

export function removeCate(id: number) {
    return sendMsg2Runtime('cate.remove', id)
}
