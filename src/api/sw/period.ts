/**
 * Period domain: request to sw. Variable requestPeriod for tree-shaking.
 */
import { sendMsg2Runtime } from "@api/chrome/runtime"

type MergeConfig = { start: timer.period.Key; end: timer.period.Key; periodSize: number }

const requestPeriod = <T, R>(code: string, data?: T) =>
    sendMsg2Runtime<T, R>(`period.${code}` as timer.mq.ReqCode, data)

export function mergePeriod(periods: timer.period.Result[], config: MergeConfig) {
    return requestPeriod<{ periods: timer.period.Result[]; config: MergeConfig }, timer.period.Row[]>('merge', { periods, config })
}
