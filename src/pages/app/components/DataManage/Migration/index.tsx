/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { t } from "@app/locale"
import { Download } from "@element-plus/icons-vue"
import Flex from "@pages/components/Flex"
import Immigration from "@service/components/immigration"
import { exportJson } from "@util/file"
import { formatTime } from "@util/time"
import { ElButton, ElCard } from "element-plus"
import { type FunctionalComponent, type StyleValue } from "vue"
import DataManageAlert from '../DataManageAlert'
import ImportButton from "./ImportButton"
import ImportOtherButton from "./ImportOtherButton"

const immigration: Immigration = new Immigration()

async function handleExport() {
    const data = await immigration.getExportingData()
    const timestamp = formatTime(new Date(), '{y}{m}{d}_{h}{i}{s}')
    exportJson(data, `timer_backup_${timestamp}`)
}

const Migration: FunctionalComponent = () => (
    <ElCard style={{ width: '100%' } satisfies StyleValue}>
        <Flex column gap={20} justify="center" height="100%" align="center">
            <DataManageAlert text={msg => msg.dataManage.migrationAlert} />
            <Flex column gap={20} maxWidth={350} flex={1}>
                <ElButton
                    size="large"
                    type="success"
                    icon={Download}
                    onClick={handleExport}
                    style={{ flex: 1 } satisfies StyleValue}
                >
                    {t(msg => msg.item.operation.exportWholeData)}
                </ElButton>
                <ImportButton />
                <ImportOtherButton />
            </Flex>
        </Flex>
    </ElCard>
)

export default Migration
