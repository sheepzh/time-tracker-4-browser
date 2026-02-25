import timelineDatabase from '@db/timeline-database'
import { useRequest } from '@hooks'
import { getStartOfDay, MILL_PER_DAY } from '@util/time'
import { defineComponent } from 'vue'
import DashboardCard from '../../DashboardCard'
import TimelineChart from './Chart'
import Summary from './Summary'
import { TIMELINE_DAY_COUNT } from './constants'

const Timeline = defineComponent<{ height: number }>(({ height }) => {
    const start = getStartOfDay(Date.now() - MILL_PER_DAY * (TIMELINE_DAY_COUNT - 1))
    const { data } = useRequest(() => timelineDatabase.select({ start }), { defaultValue: [] })

    return () => <>
        <DashboardCard span={20} height={height}>
            <TimelineChart data={data.value} />
        </DashboardCard>
        <DashboardCard span={4} height={height}>
            <Summary data={data.value} />
        </DashboardCard>
    </>
}, { props: ['height'] })

export default Timeline