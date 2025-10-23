import TooltipWrapper from "@app/components/common/TooltipWrapper"
import { t } from "@app/locale"
import { useRequest } from '@hooks/useRequest'
import Flex from "@pages/components/Flex"
import optionHolder from '@service/components/option-holder'
import { defaultDailyLimit } from '@util/constant/option'
import { meetLimit, meetTimeLimit } from "@util/limit"
import { formatPeriodCommon } from "@util/time"
import { ElTag } from "element-plus"
import { computed, defineComponent } from "vue"

const Waste = defineComponent({
    props: {
        time: Number,
        waste: {
            type: Number,
            required: true,
        },
        count: Number,
        visit: Number,
        delayCount: Number,
        allowDelay: Boolean,
    },
    setup(props) {
        const { data: delayDuration } = useRequest(
            () => optionHolder.get().then(o => o.delayDuration),
            { defaultValue: defaultDailyLimit().delayDuration },
        )
        const timeType = computed(() => meetTimeLimit(delayDuration.value, props.time, props.waste, props.allowDelay, props.delayCount) ? 'danger' : 'info')
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
    },
})

export default Waste