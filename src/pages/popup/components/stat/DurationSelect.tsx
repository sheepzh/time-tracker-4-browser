import { css } from '@emotion/css'
import { t } from "@i18n"
import calendarMessages from "@i18n/message/common/calendar"
import { isRecord } from '@util/guard'
import { type CascaderInstance, type CascaderOption, ElCascader, ElInputNumber, useNamespace } from "element-plus"
import { createGuard, createNumberUnionGuard } from 'typescript-guard'
import { computed, defineComponent, ref, watch } from "vue"
import { type DurationValue, isDuration, type StatDuration } from './context'

const rangeLabel = (duration: StatDuration, n?: string | number): string => t(calendarMessages, {
    key: msg => msg.range[duration],
    param: n ? { n } : undefined,
})

const BUILTIN_DAY_NUM = [7, 30, 90, 180] as const
type BuiltinDay = typeof BUILTIN_DAY_NUM[number]
const isBuiltinDay = createNumberUnionGuard<BuiltinDay>(7, 30, 90, 180)
const DEFAULT_CUSTOM = 365

const cvt2Opt = (value: StatDuration, n?: string | number): CascaderOption => ({
    value, label: rangeLabel(value, n),
})

const options = (num?: number): CascaderOption[] => [
    cvt2Opt('allTime'),
    {
        ...cvt2Opt('lastDays', 'X'),
        children: [
            ...BUILTIN_DAY_NUM.map(value => ({
                value,
                label: rangeLabel('lastDays', value),
            })),
            { value: 'custom', label: rangeLabel('lastDays', num ?? DEFAULT_CUSTOM) },
        ],
    },
    ...(['thisMonth', 'thisWeek', 'yesterday', 'today'] satisfies StatDuration[]).map(cvt2Opt),
]

type CasValue =
    | [Exclude<StatDuration, 'lastDays'>]
    | [type: 'lastDays', value: 'custom' | BuiltinDay]

const isCasValue = createGuard<CasValue>(val => {
    if (!Array.isArray(val)) return false
    const [type, value] = val
    if (!isDuration(type)) return false
    if (type === "lastDays") {
        return value === 'custom' || isBuiltinDay(value)
    }
    return true
})

const parseDefault = (dur: DurationValue): [CasValue, number?] => {
    let cas: CasValue, custom: number | undefined = undefined
    if (typeof dur === 'string') {
        cas = [dur]
    } else {
        const { value } = dur
        if (isBuiltinDay(value)) {
            cas = ['lastDays', value]
        } else {
            cas = ['lastDays', 'custom']
            custom = value
        }
    }
    return [cas, custom]
}

type Props = {
    defaultValue: DurationValue
    onChange: ArgCallback<DurationValue>
}

const DurationSelect = defineComponent<Props>(props => {
    const cascader = ref<CascaderInstance>()
    const [defaultCas, defaultCustom] = parseDefault(props.defaultValue)
    const cas = ref<CasValue>(defaultCas)
    const custom = ref<number>(defaultCustom ?? DEFAULT_CUSTOM)
    watch([cas, custom], () => {
        const [type] = cas.value
        if (type !== "lastDays") return props.onChange(type)
        const value = cas.value[1]
        props.onChange({ type: 'lastDays', value: value === 'custom' ? custom.value : value })
    })
    const casOptions = computed(() => options(custom.value))

    const cascaderNs = useNamespace('cascader')
    const inputNs = useNamespace('input')

    const popoverCls = css`
        & .${cascaderNs.b('panel')} {
            & .${cascaderNs.b('menu')}:nth-child(2) {
                min-width: 50px;
            }
        }
    `
    const numberCls = css`
        & .${inputNs.e("wrapper")} {
            padding: 1px 7px !important;
            .${inputNs.e("inner")} {
                text-align: start;
            }
        }
    `

    const handleInputKeydown = (ev: KeyboardEvent) => {
        if (ev.key === "Enter") cas.value = ['lastDays', 'custom']
        ev.stopPropagation()
    }

    return () => (
        <ElCascader
            ref={cascader}
            modelValue={cas.value}
            onChange={val => isCasValue(val) && (cas.value = val)}
            options={casOptions.value}
            show-all-levels={false}
            style={{ width: '130px' }}
            popperClass={popoverCls}
        >
            {(param: unknown) => {
                if (!isRecord(param) || !('node' in param)) return null
                const { node } = param
                if (!isRecord(node)) return null
                const { label, value, level } = node
                if (level === 1) return label
                if (typeof value === 'number') return value
                return value === 'custom' ? (
                    <span onClick={ev => ev.stopPropagation()} onKeydown={handleInputKeydown}>
                        <ElInputNumber
                            class={numberCls}
                            modelValue={custom.value}
                            onChange={val => val && (custom.value = val)}
                            min={1}
                            max={9999}
                            precision={0}
                            controls={false}
                            size="small"
                            aria-label={rangeLabel('lastDays', 'X')}
                            style={{ width: '50px' }}
                        />
                    </span>
                ) : null
            }}
        </ElCascader>
    )
}, { props: ['defaultValue', 'onChange'] })

export default DurationSelect