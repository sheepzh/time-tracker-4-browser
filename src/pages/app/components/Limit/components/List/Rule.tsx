import { t } from '@app/locale'
import Flex from '@pages/components/Flex'
import { isEffective, meetLimit, meetTimeLimit, period2Str } from '@util/limit'
import { formatPeriodCommon, MILL_PER_SECOND } from '@util/time'
import { ElDescriptions, ElDescriptionsItem, ElTag } from 'element-plus'
import { defineComponent, type FunctionalComponent, toRefs } from 'vue'
import { useDelayDuration } from '../../context'
import { DAILY_WEEKLY_TAG_TYPE, PERIOD_TAG_TYPE, VISIT_TAG_TYPE } from '../style'

type Props = {
    value: timer.limit.Item
}

const TimeCountPair: FunctionalComponent<{ time?: number, count?: number }> = ({ time, count }) => {
    if (!time && !count) return null
    return (
        <Flex gap={2} wrap>
            {!!time && (
                <ElTag size="small" type={DAILY_WEEKLY_TAG_TYPE}>{formatPeriodCommon(time * MILL_PER_SECOND, true)}</ElTag>
            )}
            {!!count && (
                <ElTag size="small" type={DAILY_WEEKLY_TAG_TYPE}>{`${count} ${t(msg => msg.limit.item.visits)}`}</ElTag>
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
                {props.visit ?? 0} {t(msg => msg.limit.item.visits)}
            </ElTag>
        </Flex>
    )
}

const Rule = defineComponent<Props>(({ value }) => {
    const {
        time, count, waste, visit,
        weekly, weeklyCount, weeklyWaste, weeklyVisit,
        visitTime, periods,
        weekdays,
        allowDelay, delayCount, weeklyDelayCount,
    } = toRefs(value)

    const delayDuration = useDelayDuration()

    return () => <>
        <ElDescriptions border size='small' column={1} labelWidth={130}>
            <ElDescriptionsItem label={t(msg => msg.limit.item.daily)} v-show={time?.value || count?.value}>
                <TimeCountPair time={time?.value} count={count?.value} />
            </ElDescriptionsItem>
            <ElDescriptionsItem label={t(msg => msg.limit.item.weekly)} v-show={weekly?.value || weeklyCount?.value}>
                <TimeCountPair time={weekly?.value} count={weeklyCount?.value} />
            </ElDescriptionsItem>
            {!!visitTime?.value && (
                <ElDescriptionsItem label={t(msg => msg.limit.item.visitTime)}>
                    <ElTag size="small" type={VISIT_TAG_TYPE}>{formatPeriodCommon(visitTime.value * MILL_PER_SECOND, true)}</ElTag>
                </ElDescriptionsItem>
            )}
            {!!periods?.value?.length && (
                <ElDescriptionsItem label={t(msg => msg.limit.item.period)}>
                    <Flex gap={2} wrap>
                        {periods.value.map((p, idx) => (
                            <ElTag key={idx} size="small" type={PERIOD_TAG_TYPE}>{period2Str(p)}</ElTag>
                        ))}
                    </Flex>
                </ElDescriptionsItem>
            )}
        </ElDescriptions>
        <ElDescriptions border size='small' column={1} labelWidth={130}>
            <ElDescriptionsItem label={t(msg => msg.calendar.range.today)}>
                {isEffective(weekdays?.value) ? (
                    <WastePair
                        time={{ wasted: waste.value, maxLimit: (time?.value ?? 0) * MILL_PER_SECOND }}
                        delay={{ count: delayCount.value, duration: delayDuration.value, allow: !!allowDelay.value }}
                        count={count?.value ?? 0}
                        visit={visit.value}
                    />
                ) : (
                    <ElTag type="info" size="small">
                        {t(msg => msg.limit.item.notEffective)}
                    </ElTag>
                )}
            </ElDescriptionsItem>
            <ElDescriptionsItem label={t(msg => msg.calendar.range.thisWeek)}>
                <WastePair
                    time={{ wasted: weeklyWaste.value, maxLimit: (weekly?.value ?? 0) * MILL_PER_SECOND }}
                    delay={{ count: weeklyDelayCount.value, duration: delayDuration.value, allow: !!allowDelay.value }}
                    count={weeklyCount?.value ?? 0}
                    visit={weeklyVisit.value}
                />
            </ElDescriptionsItem>
        </ElDescriptions>
    </>
}, { props: ['value'] })

export default Rule