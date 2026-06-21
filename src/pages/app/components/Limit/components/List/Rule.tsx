import { useDelayDuration } from '@app/components/Limit/context'
import { t } from '@app/locale'
import Flex from '@pages/components/Flex'
import { isEffective, meetLimit, meetTimeLimit, period2Str } from '@util/limit'
import { formatPeriodCommon, MILL_PER_SECOND } from '@util/time'
import { ElDescriptions, ElDescriptionsItem, ElTag } from 'element-plus'
import { defineComponent, type FunctionalComponent } from 'vue'
import { DAILY_WEEKLY_TAG_TYPE, PERIOD_TAG_TYPE, VISIT_TAG_TYPE } from '../style'

type Props = {
    value: tt4b.limit.Item
}

const TimeCountPair: FunctionalComponent<{ time?: number, count?: number }> = ({ time, count }) => {
    if (!time && !count) return null
    return (
        <Flex gap={2} wrap>
            {!!time && (
                <ElTag size="small" type={DAILY_WEEKLY_TAG_TYPE}>{formatPeriodCommon(time * MILL_PER_SECOND, true)}</ElTag>
            )}
            {!!count && (
                <ElTag size="small" type={DAILY_WEEKLY_TAG_TYPE}>{t(msg => msg.shared.limit.visits, { n: count })}</ElTag>
            )}
        </Flex>
    )
}

type WastePairProps = {
    time: Parameters<typeof meetTimeLimit>[0]
    delay: Parameters<typeof meetTimeLimit>[1]
    count?: number
    visit?: number
}

const WastePair: FunctionalComponent<WastePairProps> = props => {
    const timeType = meetTimeLimit(props.time, props.delay) ? 'danger' : 'info'
    const visitType = meetLimit(props.count, props.visit) ? 'danger' : 'info'

    return (
        <Flex gap={2}>
            <ElTag size="small" type={timeType}>
                {formatPeriodCommon(props.time.wasted)}
            </ElTag>
            <ElTag size="small" type={visitType}>
                {t(msg => msg.shared.limit.visits, { n: props.visit ?? 0 })}
            </ElTag>
        </Flex>
    )
}

const Rule = defineComponent<Props>(props => {
    const delayDuration = useDelayDuration()

    return () => <>
        <ElDescriptions border size='small' column={1} labelWidth={130}>
            <ElDescriptionsItem label={t(msg => msg.shared.limit.daily)} v-show={props.value.time || props.value.count}>
                <TimeCountPair time={props.value.time} count={props.value.count} />
            </ElDescriptionsItem>
            <ElDescriptionsItem label={t(msg => msg.shared.limit.weekly)} v-show={props.value.weekly || props.value.weeklyCount}>
                <TimeCountPair time={props.value.weekly} count={props.value.weeklyCount} />
            </ElDescriptionsItem>
            {!!props.value.visitTime && (
                <ElDescriptionsItem label={t(msg => msg.limit.item.visitTime)}>
                    <ElTag size="small" type={VISIT_TAG_TYPE}>{formatPeriodCommon(props.value.visitTime * MILL_PER_SECOND, true)}</ElTag>
                </ElDescriptionsItem>
            )}
            {!!props.value.periods?.length && (
                <ElDescriptionsItem label={t(msg => msg.shared.limit.period)}>
                    <Flex gap={2} wrap>
                        {props.value.periods.map((p, idx) => (
                            <ElTag key={idx} size="small" type={PERIOD_TAG_TYPE}>{period2Str(p)}</ElTag>
                        ))}
                    </Flex>
                </ElDescriptionsItem>
            )}
        </ElDescriptions>
        <ElDescriptions border size='small' column={1} labelWidth={130}>
            <ElDescriptionsItem label={t(msg => msg.calendar.range.today)}>
                {isEffective(props.value.weekdays) ? (
                    <WastePair
                        time={{ wasted: props.value.waste, maxLimit: (props.value.time ?? 0) * MILL_PER_SECOND }}
                        delay={{ count: props.value.delayCount, duration: delayDuration.value, allow: props.value.allowDelay }}
                        count={props.value.count ?? 0}
                        visit={props.value.visit}
                    />
                ) : (
                    <ElTag type="info" size="small">
                        {t(msg => msg.limit.item.notEffective)}
                    </ElTag>
                )}
            </ElDescriptionsItem>
            <ElDescriptionsItem label={t(msg => msg.calendar.range.thisWeek)}>
                <WastePair
                    time={{ wasted: props.value.weeklyWaste, maxLimit: (props.value.weekly ?? 0) * MILL_PER_SECOND }}
                    delay={{ count: props.value.weeklyDelayCount, duration: delayDuration.value, allow: props.value.allowDelay }}
                    count={props.value.weeklyCount ?? 0}
                    visit={props.value.weeklyVisit}
                />
            </ElDescriptionsItem>
        </ElDescriptions>
    </>
}, { props: ['value'] })

export default Rule