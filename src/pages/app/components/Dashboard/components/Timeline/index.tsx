import timelineDatabase from '@db/timeline-database'
import { useRequest } from '@hooks'
import { defineComponent } from 'vue'
import DashboardCard from '../../DashboardCard'
import TimelineChart from './Chart'
import Summary from './Summary'

const Timeline = defineComponent<{ height: number }>(({ height }) => {
    const { data } = useRequest(() => timelineDatabase.getAll(), { defaultValue: [] })

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