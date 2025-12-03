/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { type SopStepInstance } from "@app/components/common/DialogSop"
import { t } from "@app/locale"
import { Document } from "@element-plus/icons-vue"
import { useState } from "@hooks"
import Flex from "@pages/components/Flex"
import { ElButton, ElForm, ElFormItem, ElSelect } from "element-plus"
import { defineComponent, ref } from "vue"
import { type OtherExtension, parseFile } from "./processor"

const OTHER_NAMES: { [ext in OtherExtension]: string } = {
    webtime_tracker: "Webtime Tracker",
    web_activity_time_tracker: "Web Activity Time Tracker",
    history_trends_unlimited: "History Trends Unlimited",
}

const OTHER_FILE_FORMAT: { [ext in OtherExtension]: string } = {
    webtime_tracker: '.csv,.json',
    web_activity_time_tracker: '.csv,.json',
    history_trends_unlimited: '.tsv',
}

const ALL_TYPES: OtherExtension[] = Object.keys(OTHER_NAMES) as OtherExtension[]

const _default = defineComponent<{}>((_, ctx) => {
    const [type, setType] = useState<OtherExtension>('webtime_tracker')
    const [selectedFile, setSelectedFile] = useState<File>()
    const fileInput = ref<HTMLInputElement>()

    const parseData = async () => {
        const file = selectedFile.value
        if (!file) throw new Error(t(msg => msg.dataManage.importOther.fileNotSelected))

        const data = await parseFile(type.value, file)
        if (!data?.rows?.length) throw new Error("No rows parsed")

        return data
    }

    ctx.expose({ parseData } satisfies SopStepInstance<timer.imported.Data>)

    return () => (
        <ElForm labelWidth={100} labelPosition="left" style={{ width: '500px' }}>
            <ElFormItem label={t(msg => msg.dataManage.importOther.dataSource)} required>
                <ElSelect
                    modelValue={type.value} onChange={setType}
                    options={ALL_TYPES.map(value => ({ value, label: OTHER_NAMES[value] }))}
                />
            </ElFormItem>
            <ElFormItem label={t(msg => msg.dataManage.importOther.file)} required>
                <Flex gap={10}>
                    <ElButton icon={Document} onClick={() => fileInput.value?.click?.()}>
                        {t(msg => msg.dataManage.importOther.selectFileBtn)}
                        <input
                            ref={fileInput}
                            type="file"
                            accept={OTHER_FILE_FORMAT[type.value]}
                            style={{ display: 'none' }}
                            onChange={() => setSelectedFile(fileInput.value?.files?.[0])}
                        />
                    </ElButton>
                    {selectedFile.value?.name && <span>{selectedFile.value?.name}</span>}
                </Flex>
            </ElFormItem>
        </ElForm>
    )
})

export default _default