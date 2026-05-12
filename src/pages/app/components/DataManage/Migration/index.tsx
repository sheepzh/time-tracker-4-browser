/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { sendMsg2Runtime } from '@api/sw/common'
import { t } from '@app/locale'
import { Download, Upload } from "@element-plus/icons-vue"
import { useManualRequest } from '@hooks'
import Flex from "@pages/components/Flex"
import { deserialize, exportJson } from "@util/file"
import { formatTime } from "@util/time"
import { ElButton, ElCard, ElMessage } from "element-plus"
import { defineComponent, ref, type StyleValue } from "vue"
import { useDataMemory } from '../context'
import DataManageAlert from '../DataManageAlert'
import ImportOtherButton from "./ImportOtherButton"

const BUTTON_STYLE: StyleValue = {
    width: '100%',
    margin: 0,
}

const Migration = defineComponent(() => {
    const { refreshMemory } = useDataMemory()
    const fileInput = ref<HTMLInputElement>()

    const { refresh: handleExport } = useManualRequest(async () => {
        const data = await sendMsg2Runtime('immigration.export')
        const timestamp = formatTime(new Date(), '{y}{m}{d}_{h}{i}{s}')
        exportJson(data, `timer_backup_${timestamp}`)
    }, {
        loadingOptions: { fullscreen: true },
        onSuccess: () => ElMessage.success(t(msg => msg.operation.successMsg)),
    })

    const { refresh: onFileSelected } = useManualRequest(async () => {
        const input = fileInput.value
        try {
            const file = input?.files?.[0]
            if (!file) throw new Error(t(msg => msg.dataManage.importOther.fileNotSelected))
            const fileText = await file.text()
            const data = deserialize(fileText)
            if (!data) throw new Error(t(msg => msg.dataManage.importError))
            await sendMsg2Runtime('immigration.import', data)
        } finally {
            if (input) input.value = ''
        }
    }, {
        loadingOptions: { fullscreen: true },
        onSuccess: () => {
            refreshMemory()
            ElMessage.success(t(msg => msg.operation.successMsg))
        },
        onError: e => ElMessage.error(e instanceof Error ? e.message : String(e)),
    })

    return () => (
        <ElCard style={{ width: '100%' } satisfies StyleValue}>
            <Flex column width='100%' align='center' gap={16}>
                <DataManageAlert text={msg => msg.dataManage.migrationAlert} />
                <Flex column gap={20} maxWidth={350} width='100%' align='stretch'>
                    <ImportOtherButton />
                    <ElButton size="large" icon={Download} onClick={handleExport} style={BUTTON_STYLE}>
                        {t(msg => msg.dataManage.exportData)}
                    </ElButton>
                    <ElButton size="large" icon={Upload} onClick={() => fileInput.value?.click()} style={BUTTON_STYLE}>
                        {t(msg => msg.dataManage.restoreData)}
                        <input
                            ref={fileInput}
                            type="file"
                            accept=".json"
                            style={{ display: "none" }}
                            onChange={onFileSelected}
                        />
                    </ElButton>
                </Flex>
            </Flex>
        </ElCard>
    )
})

export default Migration
