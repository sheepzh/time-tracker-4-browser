import TooltipWrapper from "@app/components/common/TooltipWrapper"
import { t } from "@app/locale"
import Flex from "@pages/components/Flex"
import { meetLimit, meetTimeLimit } from "@util/limit"
import { formatPeriodCommon } from "@util/time"
import { ElTag } from "element-plus"
import { computed, defineComponent } from "vue"

type Props = {
    time?: number
    waste: number
    count?: number
    visit?: number
    delayCount?: number
    allowDelay?: boolean
}

const Waste = defineComponent<Props>(props => {
    const timeType = computed(() => meetTimeLimit(props.time, props.waste, props.allowDelay, props.delayCount) ? 'danger' : 'info')
    const visitType = computed(() => meetLimit(props.count, props.visit) ? 'danger' : 'info')

    return () => (
        <Flex column gap={5}>
            <div>
                <TooltipWrapper
                    trigger="hover"
                    usePopover={props.allowDelay && !!props.time}
                    placement="top"
                    v-slots={{
                        content: () => `${t(msg => msg.limit.item.delayCount)}: ${props.delayCount ?? 0}`,
                        default: () => (
                            <ElTag size="small" type={timeType.value}>
                                {formatPeriodCommon(props.waste)}
                            </ElTag>
                        ),
                    }}
                />
            </div>
            <div>
                <ElTag size="small" type={visitType.value}>
                    {props.visit ?? 0} {t(msg => msg.limit.item.visits)}
                </ElTag>
            </div>
        </Flex>
    )
}, { props: ['time', 'waste', 'count', 'visit', 'allowDelay', 'delayCount'] })

export default Waste