/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import DialogSop from '@app/components/common/DialogSop'
import { initDialogSopContext } from '@app/components/common/DialogSop/context'
import { t } from "@app/locale"
import { Files } from "@element-plus/icons-vue"
import processor from '@service/backup/processor'
import { fillExist, processImportedData } from '@service/components/import-processor'
import { getBirthday, parseTime } from '@util/time'
import { ElButton } from "element-plus"
import { defineComponent, toRaw } from "vue"
import ClientTable from '../ClientTable'
import Step2 from './Step2'
import type { DownloadForm } from './types'

const STEP_TITLES = [
    t(msg => msg.option.backup.clientTable.selectTip),
    t(msg => msg.option.backup.confirmStep),
]

async function fetchData(client: timer.backup.Client): Promise<timer.imported.Data> {
    const { id: specCid, maxDate, minDate } = client
    const start = parseTime(minDate) ?? getBirthday()
    const end = parseTime(maxDate) ?? new Date()
    const remoteRows = await processor.query({ specCid, start, end })
    const rows: timer.imported.Row[] = remoteRows.map(rr => ({
        date: rr.date,
        host: rr.host,
        focus: rr.focus,
        time: rr.time,
    }))
    await fillExist(rows)
    return { rows, focus: true, time: true }
}

const _default = defineComponent(() => {
    const { open, step, form } = initDialogSopContext<DownloadForm>({
        stepCount: STEP_TITLES.length,
        init: () => ({ data: { rows: [], focus: true, time: true }, resolution: undefined }),
        onNext: async ({ form, target }) => {
            if (target === 1) {
                const clientVal = form.client
                if (!clientVal) throw new Error(t(msg => msg.option.backup.clientTable.notSelected))
                form.data = await fetchData(clientVal)
            }
        },
        onFinish: async ({ form }) => {
            const resolution = form.resolution
            if (!resolution) throw new Error(t(msg => msg.dataManage.importOther.conflictNotSelected))
            const data = form.data
            if (!data) throw new Error(t(msg => msg.option.backup.clientTable.notSelected))
            await processImportedData(toRaw(data), resolution)
        },
    })

    return () => <>
        <ElButton type="primary" icon={Files} onClick={() => open()}>
            {t(msg => msg.option.backup.download.btn)}
        </ElButton>
        <DialogSop
            width='80%'
            title={t(msg => msg.option.backup.download.btn)}
            stepTitles={STEP_TITLES}
            finishButton={{ text: t(msg => msg.option.backup.download.btn) }}
        >
            <ClientTable v-show={step.value === 0} onSelect={c => form.client = c} />
            <Step2 v-show={step.value === 1} />
        </DialogSop>
    </>
})

export default _default