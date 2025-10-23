/**
 * Copyright (c) 2022-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { t } from "@app/locale"
import { UploadFilled } from "@element-plus/icons-vue"
import { useRequest } from "@hooks"
import { canReadRemote } from '@service/stat-service/remote'
import { ElButton, ElIcon, ElTooltip } from "element-plus"
import { computed, defineComponent } from "vue"
import { useReportFilter } from "../context"
import { ICON_BTN_STYLE } from "./common"

const _default = defineComponent(() => {
    const filter = useReportFilter()
    const content = computed(() => t(msg => msg.report.remoteReading[filter.readRemote ? 'on' : 'off']))
    const { data: visible } = useRequest(() => canReadRemote(), { defaultValue: false })

    return () => (
        <ElTooltip trigger="hover" placement="bottom-start" effect="dark" content={content.value}>
            <ElButton
                v-show={visible.value}
                size="small"
                style={ICON_BTN_STYLE}
                type={filter.readRemote ? 'primary' : undefined}
                onClick={() => filter.readRemote = !filter.readRemote}
            >
                <ElIcon size={17} style={{ padding: "0 1px" }}>
                    <UploadFilled />
                </ElIcon>
            </ElButton>
        </ElTooltip>
    )
})

export default _default