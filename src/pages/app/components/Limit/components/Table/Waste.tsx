import { t } from '@app/locale'
import Flex from "@pages/components/Flex"
import TooltipWrapper from '@pages/components/TooltipWrapper'
import { meetLimit, meetTimeLimit } from "@util/limit"
import { formatPeriodCommon } from "@util/time"
import { ElTag } from "element-plus"
import { computed, defineComponent } from "vue"

type Props = {
    time: Parameters<typeof meetTimeLimit>[0]
    delay: Parameters<typeof meetTimeLimit>[1]
    count?: number
    visit?: number
}

const Waste = defineComponent<Props>(props => {
    const timeType = computed(() => meetTimeLimit(props.time, props.delay) ? 'danger' : 'info')
    const visitType = computed(() => meetLimit(props.count, props.visit) ? 'danger' : 'info')

    return () => (
        <Flex column gap={5}>
            <div>
                <TooltipWrapper
                    trigger="hover"
                    usePopover={props.delay.allow && !!props.time}
                    placement="top"
                    v-slots={{
                        content: () => `${t(msg => msg.limit.item.delayCount)}: ${props.delay.count}`,
                        default: () => (
                            <ElTag size="small" type={timeType.value}>
                                {formatPeriodCommon(props.time.wasted)}
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
}, { props: ['time', 'delay', 'count', 'visit'] })

export default Waste