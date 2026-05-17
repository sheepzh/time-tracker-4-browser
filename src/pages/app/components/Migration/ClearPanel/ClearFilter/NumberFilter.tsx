/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { tN } from "@app/locale"
import { type DataManageMessage } from "@i18n/message/app/data-manage"
import { ElInput } from "element-plus"
import { defineComponent, type StyleValue } from "vue"

const elInput = (value: string | undefined, onChange: ArgCallback<string | undefined>, placeholder: string) => (
    <ElInput
        placeholder={placeholder}
        clearable
        size="small"
        modelValue={value}
        onInput={onChange}
        onClear={() => onChange(undefined)}
        style={{ width: '60px' } satisfies StyleValue}
    />
)

type Props = ModelValue<[string?, string?]> & {
    i18nKey: keyof DataManageMessage
    lineNo: number
}

const _default = defineComponent<Props>(props => {
    return () => (
        <p>
            <a style={{ marginInlineEnd: '10px' }}>{props.lineNo}.</a>
            {tN(msg => msg.dataManage[props.i18nKey], {
                start: elInput(props.modelValue[0], val => props.onChange?.([val, props.modelValue[1]]), '0'),
                end: elInput(props.modelValue[1], val => props.onChange?.([props.modelValue[0], val]), '∞'),
            })}
        </p>
    )
}, { props: ['modelValue', 'onChange', 'lineNo', 'i18nKey'] })

export default _default