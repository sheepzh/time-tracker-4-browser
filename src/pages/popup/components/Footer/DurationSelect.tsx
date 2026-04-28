import { css } from '@emotion/css'
import { t } from "@i18n"
import calendarMessages from "@i18n/message/common/calendar"
import { type PopupDuration } from '@popup/types'
import { type CascaderNode, type CascaderOption, ElCascader, useNamespace } from "element-plus"
import { computed, defineComponent } from "vue"

const rangeLabel = (duration: PopupDuration, n?: string | number): string => t(calendarMessages, {
    key: msg => msg.range[duration],
    param: n ? { n } : undefined,
})

const BUILTIN_DAY_NUM = [7, 30, 90, 180, 365]

const cvt2Opt = (value: PopupDuration, n?: string | number): CascaderOption => ({
    value, label: rangeLabel(value, n),
})

const options = (): CascaderOption[] => [
    cvt2Opt('allTime'),
    {
        ...cvt2Opt('lastDays', 'X'),
        children: [
            ...BUILTIN_DAY_NUM.map(value => ({
                value,
                label: rangeLabel('lastDays', value),
            })),
        ],
    },
    ...(['thisMonth', 'thisWeek', 'yesterday', 'today'] satisfies PopupDuration[]).map(cvt2Opt),
]

type DurationValue = [PopupDuration, number?]

type Props = ModelValue<DurationValue>

const DurationSelect = defineComponent<Props>(props => {
    const casVal = computed(() => {
        const [type, num] = props.modelValue
        return type === 'lastDays' ? num ?? 30 : type
    })

    const cascaderNs = useNamespace('cascader')

    const popoverCls = css`
        & .${cascaderNs.b('panel')} {
            & .${cascaderNs.b('menu')}:nth-child(2) {
                width: 100px;
                min-width: 0;
            }
        }
    `

    return () => (
        <ElCascader
            modelValue={casVal.value}
            onChange={val => props.onChange?.(val as [PopupDuration, number?])}
            options={options()}
            show-all-levels={false}
            style={{ width: '130px' }}
            popperClass={popoverCls}
        >
            {(param: any) => {
                const { label, value, level } = param?.node as CascaderNode || {}
                return level === 2 ? value : label
            }}
        </ElCascader>
    )
}, { props: ['modelValue', 'onChange'] })

export default DurationSelect