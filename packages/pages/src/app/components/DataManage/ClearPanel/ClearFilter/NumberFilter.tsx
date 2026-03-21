/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { tN } from "@app/locale"
import { type DataManageMessage } from "@i18n/message/app/data-manage"
import { ElInput } from "element-plus"
import { defineComponent, type PropType, type Ref, ref, type StyleValue, watch } from "vue"

const elInput = (ref: Ref<string | undefined>, placeholder: string) => (
    <ElInput
        placeholder={placeholder}
        clearable
        size="small"
        modelValue={ref.value}
        onInput={val => ref.value = val?.trim()}
        onClear={() => ref.value = undefined}
        style={{ width: '60px' } satisfies StyleValue}
    />
)

const _default = defineComponent({
    props: {
        translateKey: {
            type: String as PropType<keyof DataManageMessage>,
            required: true,
        },
        defaultValue: {
            type: Object as PropType<[string?, string?]>,
            required: true,
        },
        lineNo: Number,
    },
    emits: {
        change: (_val: [string?, string?]) => true,
    },
    setup(props, ctx) {
        const start = ref(props.defaultValue[0])
        const end = ref(props.defaultValue[1])
        watch([start, end], () => ctx.emit("change", [start.value, end.value]))

        return () => (
            <p>
                <a style={{ marginInlineEnd: '10px' }}>{props.lineNo}.</a>
                {tN(msg => msg.dataManage[props.translateKey], {
                    start: elInput(start, '0'),
                    end: elInput(end, '∞'),
                })}
            </p>
        )
    }
})

export default _default