import { t } from '@app/locale'
import Flex from "@pages/components/Flex"
import { period2Str } from '@util/limit'
import { formatPeriodCommon, MILL_PER_SECOND } from '@util/time'
import { ElTag, TagProps } from 'element-plus'
import { defineComponent, type FunctionalComponent, toRef } from "vue"
import { DAILY_WEEKLY_TAG_TYPE, VISIT_TAG_TYPE } from '../style'

type TimeCountPairProps = {
    time?: number
    count?: number
    label: string
    type?: TagProps['type']
}

const TimeCountPair: FunctionalComponent<TimeCountPairProps> = ({ time, count, label, type = DAILY_WEEKLY_TAG_TYPE }) => {
    const content = [
        time && formatPeriodCommon(time * MILL_PER_SECOND, true),
        count && t(msg => msg.shared.limit.visits, { n: count }),
    ].filter(Boolean).join(` ${t(msg => msg.limit.item.or)} `)

    if (!content) return null

    return (
        <div>
            <ElTag size="small" type={type}>{label}: {content}</ElTag>
        </div>
    )
}

const PeriodTag: FunctionalComponent<{ periods?: timer.limit.Period[], }> = ({ periods }) => {
    if (!periods?.length) return null

    return <>
        <div>
            <ElTag size="small" type="info">{t(msg => msg.shared.limit.period)}</ElTag>
        </div>
        <Flex justify="center" gap={4} wrap="wrap">
            {periods.map((p, idx) => <ElTag key={idx} size="small" type="info">{period2Str(p)}</ElTag>)}
        </Flex>
    </>
}

const Rule = defineComponent<{ value: timer.limit.Item }>(props => {
    const row = toRef(props, 'value')

    return () => (
        <Flex column gap={4}>
            <TimeCountPair
                time={row.value?.time}
                count={row.value?.count}
                label={t(msg => msg.shared.limit.daily)}
            />
            <TimeCountPair
                time={row.value?.weekly}
                count={row.value?.weeklyCount}
                label={t(msg => msg.shared.limit.weekly)}
            />
            <TimeCountPair
                time={row.value?.visitTime}
                label={t(msg => msg.limit.item.visitTime)}
                type={VISIT_TAG_TYPE}
            />
            <PeriodTag periods={row.value?.periods} />
        </Flex>
    )
}, { props: ['value'] })

export default Rule