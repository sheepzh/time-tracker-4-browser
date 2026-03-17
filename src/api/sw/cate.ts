/**
 * Cate domain: request to sw. Variable requestCate for tree-shaking.
 */
import { sendMsg2Runtime } from "@api/chrome/runtime"

const requestCate = <T, R>(code: string, data?: T) =>
    sendMsg2Runtime<T, R>(`cate.${code}` as timer.mq.ReqCode, data)

export function listCates() {
    return requestCate<void, timer.site.Cate[]>('listAll')
}

export function addCate(name: string) {
    return requestCate<string, timer.site.Cate>('add', name)
}

export function saveCateName(id: number, name: string) {
    return requestCate<{ id: number; name: string }, void>('saveName', { id, name })
}

export function removeCate(id: number) {
    return requestCate<number, void>('remove', id)
}
