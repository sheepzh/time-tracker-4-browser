import { sendMsg2Runtime } from "./common"

export function listTimeline(query: timer.timeline.Query) {
    return sendMsg2Runtime('timeline.list', query)
}
