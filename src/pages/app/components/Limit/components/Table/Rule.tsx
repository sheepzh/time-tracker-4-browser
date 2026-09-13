import { t } from '@app/locale'
import { Flex } from '@pages/components'
import { period2Str } from '@pages/util/limit'
import { truthy } from '@util/lang'
import { formatPeriodCommon, MILL_PER_SECOND } from '@util/time'
import { ElTag, TagProps } from 'element-plus'
import { type FunctionalComponent } from "vue"
import { DAILY_WEEKLY_TAG_TYPE, VISIT_TAG_TYPE } from '../style'

type TimeCountPairProps = {
    time?: number
    count?: number
    label: string
    type?: TagProps['type']
}

const TimeCountPair: FunctionalComponent<TimeCountPairProps> = ({ time, count, label, type = DAILY_WEEKLY_TAG_TYPE }) => {
    const content = truthy(
        time && formatPeriodCommon(time * MILL_PER_SECOND, true),
        count && t(msg => msg.shared.limit.visits, { n: count }),
    ).join(` ${t(msg => msg.limit.item.or)} `)

    return content && <div><ElTag size="small" type={type}>{label}: {content}</ElTag></div>
}

const PeriodTag: FunctionalComponent<{ periods?: tt4b.limit.Period[] }> = ({ periods }) => {
    if (!periods?.length) return null

    return <>
        <div>
            <ElTag size="small" type="info">{t(msg => msg.shared.limit.period)}</ElTag>
        </div>
        <Flex justify="center" gap={4} wrap="wrap">
            {periods.map(p => <ElTag key={`${p[0]}-${p[1]}`} size="small" type="info">{period2Str(p)}</ElTag>)}
        </Flex>
    </>
}

const Rule: FunctionalComponent<{ value: tt4b.limit.Item }> = ({
    value: { time, count, weekly, weeklyCount, visitTime, periods }
}) => (
    <Flex column gap={4}>
        <TimeCountPair label={t(msg => msg.shared.limit.daily)} time={time} count={count} />
        <TimeCountPair label={t(msg => msg.shared.limit.weekly)} time={weekly} count={weeklyCount} />
        <TimeCountPair label={t(msg => msg.limit.item.visitTime)} type={VISIT_TAG_TYPE} time={visitTime} />
        <PeriodTag periods={periods} />
    </Flex>
)

export default Rule