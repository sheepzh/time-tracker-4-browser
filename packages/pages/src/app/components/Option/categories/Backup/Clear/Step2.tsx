/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { t } from "@app/locale"
import { ElAlert } from "element-plus"
import { defineComponent, toRaw } from "vue"
import { type StatResult } from "./Step1"

const _default = defineComponent<{ data?: StatResult }>(props => {
    return () => (
        <ElAlert type="success" closable={false}>
            {t(msg => msg.option.backup.clear.confirmTip, {
                ...toRaw(props.data),
                clientName: props.data?.client?.name || ''
            })}
        </ElAlert>
    )
}, { props: ['data'] })

export default _default