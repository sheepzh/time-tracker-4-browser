/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { processImportedData } from '@/api/sw/import'
import DialogSop from '@app/components/common/DialogSop'
import { initDialogSopContext } from '@app/components/common/DialogSop/context'
import { t } from "@app/locale"
import { Upload } from "@element-plus/icons-vue"
import Flex from '@pages/components/Flex'
import { ElButton } from "element-plus"
import { defineComponent, toRaw } from "vue"
import { useDataMemory } from '../../context'
import { parseFile } from './processor'
import Step1 from './Step1'
import Step2 from './Step2'
import type { ImportForm } from './types'

const STEP_TITLES = [
    t(msg => msg.dataManage.importOther.step1),
    t(msg => msg.dataManage.importOther.step2),
]

const _default = defineComponent(() => {
    const { refreshMemory } = useDataMemory()

    const { step, open } = initDialogSopContext<ImportForm>({
        stepCount: 2,
        init: () => ({ ext: 'webtime_tracker', data: { rows: [], focus: true, time: true } }),
        onNext: async ({ form }) => {
            const file = form.file
            if (!file) throw new Error(t(msg => msg.dataManage.importOther.fileNotSelected))

            const data = await parseFile(form.ext, file)
            if (!data.rows.length) throw new Error("No rows parsed")
            form.data = data
        },
        onFinish: async ({ form }) => {
            const data = form.data
            if (!data) throw new Error(t(msg => msg.dataManage.importOther.fileNotSelected))
            const resolution = form.resolution
            if (!resolution) throw new Error(t(msg => msg.dataManage.importOther.conflictNotSelected))
            await processImportedData({ data: toRaw(data), resolution })
            refreshMemory?.()
        },
    })

    return () => <>
        <ElButton
            size="large"
            type="warning"
            icon={Upload}
            onClick={() => open()}
            style={{ margin: 0, flex: 1, width: '100%', textWrap: 'wrap', lineHeight: '1.4em' }}
        >
            {t(msg => msg.item.operation.importOtherData)}
        </ElButton>
        <DialogSop
            title={t(msg => msg.item.operation.importOtherData)}
            stepTitles={STEP_TITLES}
            width='80%' top="10vh"
        >
            <Flex width="100%" justify="center">
                <Step1 v-show={step.value === 0} />
                <Step2 v-show={step.value === 1} />
            </Flex>
        </DialogSop>
    </>
})

export default _default