/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { useDialogSop } from '@app/components/common/DialogSop/context'
import { t } from '@app/locale'
import { Document } from "@element-plus/icons-vue"
import Flex from "@pages/components/Flex"
import { ElButton, ElForm, ElFormItem } from "element-plus"
import { defineComponent, ref } from "vue"
import type { ImportForm, OtherExtension } from './types'

const OTHER_FILE_FORMAT: Record<OtherExtension, string> = {
    webtime_tracker: '.csv,.json',
    web_activity_time_tracker: '.csv,.json',
    history_trends_unlimited: '.tsv',
}

const _default = defineComponent<{}>(() => {
    const { form } = useDialogSop<ImportForm>()
    const fileInput = ref<HTMLInputElement>()

    return () => (
        <ElForm labelWidth={100} labelPosition="left" style={{ width: '500px' }}>
            <ElFormItem label={t(msg => msg.dataManage.importOther.file)} required>
                <Flex gap={10}>
                    <ElButton icon={Document} onClick={() => fileInput.value?.click?.()}>
                        {t(msg => msg.dataManage.importOther.selectFileBtn)}
                        <input
                            key={form.ext}
                            ref={fileInput}
                            type="file"
                            accept={OTHER_FILE_FORMAT[form.ext]}
                            style={{ display: 'none' }}
                            onChange={() => form.file = fileInput.value?.files?.[0]}
                        />
                    </ElButton>
                    {<span>{form.file?.name ?? ''}</span>}
                </Flex>
            </ElFormItem>
        </ElForm>
    )
})

export default _default