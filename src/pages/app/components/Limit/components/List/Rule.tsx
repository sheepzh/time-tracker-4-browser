import { t } from '@app/locale'
import Flex from '@pages/components/Flex'
import { isEffective, meetLimit, meetTimeLimit, period2Str } from '@util/limit'
import { formatPeriodCommon, MILL_PER_SECOND } from '@util/time'
import { ElDescriptions, ElDescriptionsItem, ElTag } from 'element-plus'
import { computed, defineComponent, type FunctionalComponent, toRefs } from 'vue'
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
    time?: number
    waste: number
    count?: number
    visit?: number
    delayCount?: number
    allowDelay?: boolean
}

const WastePair: FunctionalComponent<WastePairProps> = props => {
    const timeType = computed(() => meetTimeLimit(props.time, props.waste, props.allowDelay, props.delayCount) ? 'danger' : 'info')
    const visitType = computed(() => meetLimit(props.count, props.visit) ? 'danger' : 'info')

    return (
        <Flex gap={2}>
            <ElTag size="small" type={timeType.value}>
                {formatPeriodCommon(props.waste)}
            </ElTag>
            <ElTag size="small" type={visitType.value}>
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
                        waste={waste?.value}
                        time={time?.value}
                        count={count?.value}
                        visit={visit?.value}
                        allowDelay={allowDelay?.value}
                        delayCount={delayCount?.value}
                    />
                ) : (
                    <ElTag type="info" size="small">
                        {t(msg => msg.limit.item.notEffective)}
                    </ElTag>
                )}
            </ElDescriptionsItem>
            <ElDescriptionsItem label={t(msg => msg.calendar.range.thisWeek)}>
                <WastePair
                    waste={weeklyWaste?.value}
                    time={weekly?.value}
                    count={weeklyCount?.value}
                    visit={weeklyVisit?.value}
                    allowDelay={allowDelay?.value}
                    delayCount={weeklyDelayCount?.value}
                />
            </ElDescriptionsItem>
        </ElDescriptions>
    </>
}, { props: ['value'] })

export default Rule