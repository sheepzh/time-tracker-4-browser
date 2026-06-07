/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { t } from "@app/locale"
import { Delete } from "@element-plus/icons-vue"
import { useState } from "@hooks"
import Box from '@pages/components/Box'
import { ElButton } from "element-plus"
import { defineComponent } from "vue"
import DateFilter from "./DateFilter"
import NumberFilter from "./NumberFilter"

type Props = {
    onDelete?: (date: [Date, Date] | undefined, focus: [string?, string?], time: [string?, string?]) => void
}

const _default = defineComponent<Props>(props => {
    const [date, setDate] = useState<[Date, Date]>()
    const [focus, setFocus] = useState<[string?, string?]>(['0', '2'])
    const [time, setTime] = useState<[string?, string?]>(['0',])
    const handleDelete = () => props.onDelete?.(date.value, focus.value, time.value)

    return () => (
        <div style={{ paddingInlineStart: '30px', paddingTop: '40px' }}>
            <h3>{t(msg => msg.dataManage.filterItems)}</h3>
            <DateFilter modelValue={date.value} onChange={setDate} />
            <NumberFilter i18nKey="filterFocus" lineNo={2} modelValue={focus.value} onChange={setFocus} />
            <NumberFilter i18nKey="filterTime" lineNo={3} modelValue={time.value} onChange={setTime} />
            <Box marginTop={40}>
                <ElButton icon={Delete} type="danger" onClick={handleDelete}>
                    {t(msg => msg.button.delete)}
                </ElButton>
            </Box>
        </div>
    )
}, { props: ['onDelete'] })

export default _default