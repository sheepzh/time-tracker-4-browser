/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { useDialogSop } from '@app/components/common/DialogSop/context'
import CompareTable from "@app/components/common/imported/CompareTable"
import ResolutionRadio from "@app/components/common/imported/ResolutionRadio"
import { t } from '@app/locale'
import Flex from "@pages/components/Flex"
import { ElAlert } from "element-plus"
import { defineComponent } from "vue"
import { DownloadForm } from './types'

const _default = defineComponent<{}>(() => {
    const { form } = useDialogSop<DownloadForm>()

    return () => (
        <Flex column width='100%' gap={20} margin='40px 20px 0 20px'>
            <ElAlert type="success" closable={false}>
                {
                    t(msg => msg.option.backup.download.confirmTip, {
                        clientName: form.client?.name,
                        size: form.data.rows.length,
                    })
                }
            </ElAlert>
            <CompareTable data={form.data} comparedCol={msg => msg.option.backup.download.willDownload} />
            <Flex justify="center">
                <ResolutionRadio modelValue={form.resolution} onChange={v => form.resolution = v} />
            </Flex>
        </Flex>
    )
})

export default _default
