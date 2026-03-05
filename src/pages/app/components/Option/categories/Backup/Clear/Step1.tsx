/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { type SopStepInstance } from "@app/components/common/DialogSop"
import { t } from "@app/locale"
import { useState } from "@hooks"
import processor from "@service/backup/processor"
import { BIRTHDAY, getBirthday, parseTime } from "@util/time"
import { defineComponent } from "vue"
import ClientTable from "../ClientTable"

export type StatResult = {
    rowCount: number
    hostCount: number
    client: timer.backup.Client
}

async function fetchStatResult(client: timer.backup.Client): Promise<StatResult> {
    const { id: specCid, maxDate, minDate = BIRTHDAY } = client
    const start = parseTime(minDate) ?? getBirthday()
    const end = parseTime(maxDate) ?? new Date()
    const remoteRows: timer.core.Row[] = await processor.query({ specCid, start, end })
    const siteSet: Set<string> = new Set()
    remoteRows?.forEach(row => {
        const { host } = row || {}
        host && siteSet.add(host)
    })
    const rowCount = remoteRows?.length || 0
    const hostCount = siteSet?.size || 0
    return {
        rowCount,
        hostCount,
        client,
    }
}

const _default = defineComponent((_, ctx) => {
    const [client, setClient] = useState<timer.backup.Client>()

    const parseData = (): Promise<StatResult> => {
        const clientVal = client.value
        if (!clientVal) throw new Error(t(msg => msg.option.backup.clientTable.notSelected))
        return fetchStatResult(clientVal)
    }

    ctx.expose({ parseData } satisfies SopStepInstance<StatResult>)

    return () => <ClientTable onSelect={setClient} />
})

export default _default