import { t } from '@app/locale'
import { InfoFilled } from '@element-plus/icons-vue'
import { useShadow } from '@hooks'
import Flex from '@pages/components/Flex'
import { groupBy } from '@util/array'
import { MILL_PER_HOUR, MILL_PER_MINUTE } from '@util/time'
import { ElIcon, ElRate, ElText, ElTooltip } from 'element-plus'
import { computed, defineComponent } from 'vue'
import { useTimelineContext } from './context'

const MAX_SCORE = 5

const defaultResult = (): { busy: number, focus: number } => ({
    busy: 1,
    focus: 1,
})

const computeSessionScore = (activities: timer.timeline.Activity[], hourCount: number) => {
    let continuousSessions = 0
    let currentSession: timer.timeline.Activity[] = []

    activities.sort((a, b) => a.start - b.start).forEach(current => {
        if (!currentSession.length) {
            currentSession.push(current)
            return
        }

        const prev = currentSession[currentSession.length - 1]
        const gap = current.start - (prev.start + prev.duration)

        if (gap <= MILL_PER_MINUTE * 3) {
            currentSession.push(current)
        } else {
            if (currentSession.length > 1) continuousSessions++
            currentSession = [current]
        }
    })

    if (currentSession.length > 1) continuousSessions++

    const sessionDensity = continuousSessions / Math.max(1, hourCount / 10)
    return Math.min(sessionDensity, MAX_SCORE)
}

const analyze = (activities: timer.timeline.Activity[]): { busy: number, focus: number } => {
    if (!activities.length) return defaultResult()

    const minTime = activities.map(t => t.start).sort((a, b) => a - b)[0]!
    const maxTime = activities.map(t => t.start + t.duration).sort((a, b) => b - a)[0]!
    const totalRange = maxTime - minTime
    const totalActiveTime = activities.reduce((sum, s) => sum + s.duration, 0)

    // { hourStart: distinct series keys } — same merge dimension as the chart
    const hourlyData = groupBy(activities,
        t => Math.floor(t.start / MILL_PER_HOUR) * MILL_PER_HOUR,
        l => new Set(l.map(t => t.seriesKey)),
    )

    // busyScore = timeDensity * 0.6 + seriesCountPerHour * 0.4
    const timeDensity = totalActiveTime / totalRange
    const timeDensityScore = Math.min(timeDensity / 0.3, MAX_SCORE)
    const maxSeriesCount = Object.values(hourlyData).map(keys => keys.size).sort((a, b) => b - a)[0]!
    const seriesMaxScore = Math.min(maxSeriesCount / 4, MAX_SCORE)
    const busy = timeDensityScore * 0.6 + seriesMaxScore * 0.4

    // focusScore = duration * 0.7 + session * 0.3
    const avgDuration = totalActiveTime / activities.length
    const avgDurationScore = Math.min(avgDuration / (2 * MILL_PER_MINUTE), MAX_SCORE)
    const sessionScore = computeSessionScore(activities, Object.keys(hourlyData).length)
    const focus = avgDurationScore * 0.7 + sessionScore * 0.3

    return { busy, focus }
}

const Score = defineComponent<{ score: number, label: string, desc: string }>(props => {
    const [score] = useShadow(() => props.score)
    return () => (
        <Flex align='center' column justify='center' gap={10}>
            <ElText>
                {`${props.label} `}
                <ElTooltip content={props.desc}>
                    <ElText size='small'>
                        <ElIcon>
                            <InfoFilled />
                        </ElIcon>
                    </ElText>
                </ElTooltip>
            </ElText>
            <ElRate disabled modelValue={parseFloat(score.value.toFixed(1))} showScore />
        </Flex>
    )
}, { props: ['desc', 'label', 'score'] })

const Summary = defineComponent<{}>(() => {
    const { activities } = useTimelineContext()
    const scores = computed(() => analyze(activities.value))

    return () => (
        <Flex column justify='center' gap={30} height='100%'>
            <Score
                score={scores.value.busy}
                label={t(msg => msg.dashboard.timeline.busyScore)}
                desc={t(msg => msg.dashboard.timeline.busyScoreDesc)}
            />
            <Score
                score={scores.value.focus}
                label={t(msg => msg.dashboard.timeline.focusScore)}
                desc={t(msg => msg.dashboard.timeline.focusScoreDesc)}
            />
        </Flex>
    )
})

export default Summary