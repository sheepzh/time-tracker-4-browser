/**
 * Period domain: request to sw.
 */
import { sendMsg2Runtime } from "@api/chrome/runtime"

type MergeConfig = { start: timer.period.Key; end: timer.period.Key; periodSize: number }

export function mergePeriod(periods: timer.period.Result[], config: MergeConfig) {
    return sendMsg2Runtime('period.merge', { periods, config })
}
