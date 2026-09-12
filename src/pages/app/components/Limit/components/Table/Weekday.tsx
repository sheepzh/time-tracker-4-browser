import { t } from "@app/locale"
import { Flex } from '@pages/components'
import { ElTag } from "element-plus"
import { type FunctionalComponent } from "vue"

const ALL_WEEKDAYS = t(msg => msg.calendar.weekDays)?.split('|')

const Weekday: FunctionalComponent<{ value?: number[] }> = ({ value = [] }) => !value.length || value.length === 7 ? (
    <ElTag size="small" type="success">
        {t(msg => msg.calendar.range.everyday)}
    </ElTag>
) : (
    <Flex justify="center" wrap="wrap" gap={5} style={{ margin: "0 10px" }}>
        {value.map(w => <ElTag key={w} size="small">{ALL_WEEKDAYS[w]}</ElTag>)}
    </Flex>
)

export default Weekday