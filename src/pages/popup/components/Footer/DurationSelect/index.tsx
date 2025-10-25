import { t } from "@i18n"
import calendarMessages from "@i18n/message/common/calendar"
import { type PopupDuration } from '@popup/context'
import { type CascaderNode, type CascaderOption, ElCascader, ExpandTrigger } from "element-plus"
import { computed, type CSSProperties, defineComponent, type PropType } from "vue"
import "./style.sass"

export const rangeLabel = (duration: PopupDuration, n?: string | number): string => {
    return t(calendarMessages, {
        key: msg => msg.range[duration],
        param: n ? { n } : undefined,
    })
}

const BUILTIN_DAY_NUM = [7, 30, 90, 180, 365]

const cvt2Opt = (value: PopupDuration, n?: string | number): CascaderOption => ({
    value, label: rangeLabel(value, n),
})

const options = (reverse?: boolean): CascaderOption[] => {
    const result: CascaderOption[] = [
        ...(['today', 'thisWeek', 'thisMonth', 'yesterday'] satisfies PopupDuration[]).map(cvt2Opt),
        {
            ...cvt2Opt('lastDays', 'X'),
            children: [
                ...BUILTIN_DAY_NUM.map(value => ({
                    value,
                    label: rangeLabel('lastDays', value),
                })),
            ],
        },
        cvt2Opt('allTime'),
    ]
    return reverse ? result.reverse() : result
}

export type DurationValue = [PopupDuration, number?]

const DurationSelect = defineComponent({
    props: {
        modelValue: Array as unknown as PropType<DurationValue>,
        size: String as PropType<"" | "small" | "default" | "large">,
        expandTrigger: String as PropType<ExpandTrigger>,
        reverse: Boolean,
        style: Object as PropType<CSSProperties>,
    },
    emits: {
        change: (_val: DurationValue) => true,
    },
    setup(props, ctx) {
        const casVal = computed(() => {
            const [type, num] = props.modelValue || []
            return type === 'lastDays' ? num || 30 : type || 'today'
        })

        return () => (
            <ElCascader
                modelValue={casVal.value}
                onChange={val => ctx.emit('change', val as [PopupDuration, number?])}
                options={options(props.reverse)}
                props={{ expandTrigger: props.expandTrigger }}
                show-all-levels={false}
                style={{ width: '130px', ...props.style || {} }}
                popperClass="duration-select-popover"
                size={props.size}
            >
                {(param: any) => {
                    const { label, value, level } = param?.node as CascaderNode || {}
                    return level === 2 ? value : label
                }}
            </ElCascader >
        )
    }
})

export default DurationSelect