/**
 * Copyright (c) 2023-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import DialogSop from "@app/components/common/DialogSop"
import { initDialogSopContext } from '@app/components/common/DialogSop/context'
import { t } from "@app/locale"
import { Delete } from "@element-plus/icons-vue"
import processor from '@service/backup/processor'
import { BIRTHDAY, getBirthday, parseTime } from '@util/time'
import { ElButton } from "element-plus"
import { defineComponent } from "vue"
import ClientTable from '../ClientTable'
import Step2 from './Step2'
import type { ClearForm, StatResult } from './types'

const STEP_TITLES = [
    t(msg => msg.option.backup.clientTable.selectTip),
    t(msg => msg.option.backup.confirmStep),
]

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
    return { rowCount, hostCount }
}

const _default = defineComponent(() => {
    const { step, form, open } = initDialogSopContext<ClearForm>({
        stepCount: STEP_TITLES.length,
        init: () => ({}),
        onNext: async ({ form }) => {
            const client = form.client
            if (!client) throw new Error(t(msg => msg.option.backup.clientTable.notSelected))
            form.result = await fetchStatResult(client)
        },
        onFinish: async ({ form }) => {
            const cid = form.client?.id
            if (!cid) throw new Error(t(msg => msg.option.backup.clientTable.notSelected))
            const result = await processor.clear(cid)
            if (!result.success) throw new Error(result.errorMsg)
        },
    })


    return () => <>
        <ElButton type="danger" icon={Delete} onClick={() => open()}>
            {t(msg => msg.option.backup.clear.btn)}
        </ElButton>
        <DialogSop
            title={t(msg => msg.option.backup.clear.btn)}
            finishButton={{ type: 'danger', text: t(msg => msg.option.backup.clear.btn) }}
            stepTitles={STEP_TITLES}
        >
            {step.value === 0 ? <ClientTable onSelect={c => form.client = c} /> : <Step2 />}
        </DialogSop>
    </>
})

export default _default