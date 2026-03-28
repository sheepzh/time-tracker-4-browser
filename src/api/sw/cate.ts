import { sendMsg2Runtime } from "./common"

export function listCates() {
    return sendMsg2Runtime('cate.all')
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
