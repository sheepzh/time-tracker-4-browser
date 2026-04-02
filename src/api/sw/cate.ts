import { sendMsg2Runtime } from "./common"

export function allCates() {
    return sendMsg2Runtime('cate.all')
}