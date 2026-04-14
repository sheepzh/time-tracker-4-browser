/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { previewBackup } from '@/api/sw/backup'
import { importOther } from '@/api/sw/immigration'
import DialogSop from '@app/components/common/DialogSop'
import { initDialogSopContext } from '@app/components/common/DialogSop/context'
import { t } from "@app/locale"
import { Files } from "@element-plus/icons-vue"
import { BIRTHDAY, formatTimeYMD } from '@util/time'
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
    const start = minDate ?? BIRTHDAY
    const end = maxDate ?? formatTimeYMD(Date.now())
    const rows = await previewBackup({ specCid, start, end })
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
            await importOther({ resolution, data: toRaw(data) })
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