import { sendMsg2Runtime } from "./common"

export function getInstallTime() {
    return sendMsg2Runtime('meta.installTs')
}
