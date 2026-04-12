import DashboardCard from '@app/components/Dashboard/DashboardCard'
import { defineComponent } from 'vue'
import TimelineChart from './Chart'
import Summary from './Summary'
import { initTimelineContext } from './context'

const Timeline = defineComponent<{ height: number }>(({ height }) => {
    initTimelineContext()

    return () => <>
        <DashboardCard span={20} height={height}>
            <TimelineChart />
        </DashboardCard>
        <DashboardCard span={4} height={height}>
            <Summary />
        </DashboardCard>
    </>
}, { props: ['height'] })

export default Timeline