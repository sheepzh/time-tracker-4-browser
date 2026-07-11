/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { tN } from "@app/locale"
import type { DataManageMessage } from "@i18n/message/app/data-manage"
import { ElInput } from "element-plus"
import type { FunctionalComponent, StyleValue } from "vue"

type Props = ModelValue<string> & {
    i18nKey: keyof DataManageMessage
    lineNo: number
}

const NumberFilter: FunctionalComponent<Props> = ({ lineNo, i18nKey, modelValue, onChange }) => (
    <p>
        <a style={{ marginInlineEnd: '10px' }}>{lineNo}.</a>
        {tN(msg => msg.dataManage[i18nKey], {
            value: <ElInput
                placeholder='∞'
                clearable
                size="small"
                modelValue={modelValue}
                // `onChange` is bound to <p> element
                onChange={(_, ev) => ev?.stopPropagation()}
                onUpdate:modelValue={onChange}
                onClear={() => onChange?.('')}
                style={{ width: '60px' } satisfies StyleValue}
            />
        })}
    </p>
)

export default NumberFilter