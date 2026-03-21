import Flex from "@pages/components/Flex"
import { t } from "@popup/locale"
import { ElTag } from "element-plus"
import { computed, defineComponent, toRef, type PropType } from "vue"

const ALL_WEEKDAYS = t(msg => msg.calendar.weekDays)?.split('|')

const Weekday = defineComponent({
    props: {
        value: Array as PropType<number[]>,
    },
    setup(props) {
        const weekdays = toRef(props, 'value')
        const isFull = computed(() => !weekdays.value?.length || weekdays.value?.length === 7)

        return () => isFull.value ? (
            <ElTag size="small" type="success">
                {t(msg => msg.calendar.range.everyday)}
            </ElTag>
        ) : (
            <Flex justify="center" wrap="wrap" gap={5} style={{ margin: "0 10px" }}>
                {weekdays.value?.map(w => <ElTag size="small">{ALL_WEEKDAYS[w]}</ElTag>)}
            </Flex>
        )
    },
})

export default Weekday