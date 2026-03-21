/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { trySendMsg2Runtime } from '@/api/sw/common'
import { formatPeriodCommon } from "@util/time"
import { t } from "./locale"

/**
 * Print info of today
 */
export default async function printInfo(host: string) {
    const waste = await trySendMsg2Runtime('cs.getTodayInfo', host)
    if (!waste) return
    const { time, focus } = waste

    const param = {
        time: `${time ?? '-'}`,
        focus: formatPeriodCommon(focus ?? 0),
        host,
    }
    const info0 = t(msg => msg.console.consoleLog, param)
    const info1 = t(msg => msg.console.closeAlert, { appName: t(msg => msg.meta.name) })
    console.log(info0)
    console.log(info1)
}