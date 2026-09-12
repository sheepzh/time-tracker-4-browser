import { t } from '@app/locale'
import { Flex, TooltipWrapper } from '@pages/components'
import { meetLimit, meetTimeLimit } from "@util/limit"
import { formatPeriodCommon } from "@util/time"
import { ElTag, type TagProps } from "element-plus"
import { type FunctionalComponent } from "vue"

type Props = {
    time: Parameters<typeof meetTimeLimit>[0]
    delay: Parameters<typeof meetTimeLimit>[1]
    count?: number
    visit?: number
}

const timeType = ({ time, delay }: Props): TagProps['type'] => meetTimeLimit(time, delay) ? 'danger' : 'info'
const visitType = ({ count, visit }: Props): TagProps['type'] => meetLimit(count, visit) ? 'danger' : 'info'

const Waste: FunctionalComponent<Props> = props => (
    <Flex column gap={5}>
        <div>
            <TooltipWrapper
                trigger="hover"
                usePopover={props.delay.allow && !!props.time}
                placement="top"
                v-slots={{
                    content: () => `${t(msg => msg.limit.item.delayCount)}: ${props.delay.count}`,
                    default: () => (
                        <ElTag size="small" type={timeType(props)}>
                            {formatPeriodCommon(props.time.wasted)}
                        </ElTag>
                    ),
                }}
            />
        </div>
        <div>
            <ElTag size="small" type={visitType(props)}>
                {t(msg => msg.shared.limit.visits, { n: props.visit ?? 0 })}
            </ElTag>
        </div>
    </Flex>
)

export default Waste