import { Search } from "@element-plus/icons-vue"
import { css } from '@emotion/css'
import { useState } from "@hooks"
import Flex from "@pages/components/Flex"
import { getDatePickerIconSlots } from '@pages/element-ui/rtl'
import { t } from "@side/locale"
import { type DateCell, ElDatePicker, ElInput, useNamespace } from "element-plus"
import { defineComponent, h } from "vue"
import Cell from './Cell'
import { useDatePicker } from './useDatePicker'

const useCalendarStyle = () => {
    const inputNs = useNamespace('input')

    const triggerCls = css`
        width: fit-content !important;

        & .${inputNs.e('wrapper')} {
            cursor: pointer;
            background: none !important;
            padding: 1px 0 !important;

            & .${inputNs.e('inner')} {
                display: none;
            }

            & .${inputNs.e('icon')} {
                width: fit-content;
                padding: 0px 8px;
                margin-inline-end: 0 !important;
                height: 100%;
            }
        }
    `

    const dateTableNs = useNamespace('date-table')
    const popoverCls = css`
        & .${dateTableNs.be('cell', 'text')} {
            text-align: center;
        }
    `

    return [triggerCls, popoverCls]
}

type Props = {
    defaultDate: Date
    defaultQuery: string
    onSearch?: (query: string, date: Date) => void
}

const _default = defineComponent<Props>(props => {
    const [query, setQuery] = useState(props.defaultQuery)
    const handleSearch = () => props.onSearch?.(query.value.trim(), date.value)
    const {
        date, setDate, dataDates,
        disabledDate, onPanelChange,
    } = useDatePicker({ onChange: handleSearch })

    const [calendarCls, popoverCls] = useCalendarStyle()

    return () => (
        <Flex gap={4}>
            <ElInput
                placeholder={t(msg => msg.list.searchPlaceholder)}
                prefixIcon={Search}
                modelValue={query.value}
                onInput={setQuery}
                clearable
                onClear={() => {
                    setQuery('')
                    handleSearch()
                }}
                onKeydown={kv => (kv as KeyboardEvent).code === 'Enter' && handleSearch()}
            />
            {/* The events of date picker is not compatible with typescript, so use h() to workaround */}
            {h(ElDatePicker, {
                clearable: false,
                disabledDate,
                modelValue: date.value,
                'onUpdate:modelValue': setDate,
                class: calendarCls,
                popperClass: popoverCls,
                onPanelChange,
            }, {
                ...getDatePickerIconSlots(),
                default: (cell: DateCell) => <Cell cell={cell} dataDates={dataDates.value} />,
            })}
        </Flex>
    )
}, { props: ['defaultDate', 'defaultQuery', 'onSearch'] })

export default _default