import { t } from '@app/locale'
import { InfoFilled } from '@element-plus/icons-vue'
import { useShadow } from '@hooks/index'
import Flex from '@pages/components/Flex'
import { groupBy } from '@util/array'
import { MILL_PER_HOUR, MILL_PER_MINUTE } from '@util/time'
import { ElIcon, ElRate, ElText, ElTooltip } from 'element-plus'
import { computed, defineComponent, watch } from 'vue'

type AnalysisResult = {
    busy: number
    focus: number
}

const MAX_SCORE = 5

const defaultResult = (): AnalysisResult => ({
    busy: 1,
    focus: 1,
})

const computeSessionScore = (ticks: timer.timeline.Tick[], hourCount: number) => {
    let continuousSessions = 0
    let currentSession: timer.timeline.Tick[] = []

    ticks.sort((a, b) => a.start - b.start).forEach(currentTick => {
        if (!currentSession.length) {
            currentSession.push(currentTick)
            return
        }

        const prevTick = currentSession[currentSession.length - 1]
        const gap = currentTick.start - (prevTick.start + prevTick.duration)

        if (gap <= MILL_PER_MINUTE * 3) {
            currentSession.push(currentTick)
        } else {
            if (currentSession.length > 1) continuousSessions++
            currentSession = [currentTick]
        }
    })

    if (currentSession.length > 1) continuousSessions++

    const sessionDensity = continuousSessions / Math.max(1, hourCount / 10)
    return Math.min(sessionDensity, MAX_SCORE)
}

const analyze = (ticks: timer.timeline.Tick[]): AnalysisResult => {
    if (!ticks.length) return defaultResult()

    const minTime = ticks.map(t => t.start).sort((a, b) => a - b)[0]!
    const maxTime = ticks.map(t => t.start + t.duration).sort((a, b) => b - a)[0]!
    const totalRange = maxTime - minTime
    const totalActiveTime = ticks.reduce((sum, tick) => sum + tick.duration, 0)

    // { hourStart: hosts }
    const hourlyData = groupBy(ticks,
        t => Math.floor(t.start / MILL_PER_HOUR) * MILL_PER_HOUR,
        l => new Set(l.map(t => t.host)),
    )

    // busyScore = timeDensity * 0.6 + hostCountPerHour * 0.4
    const timeDensity = totalActiveTime / totalRange
    const timeDensityScore = Math.min(timeDensity / 0.3, MAX_SCORE)
    const maxHostCount = Object.values(hourlyData).map(hosts => hosts.size).sort((a, b) => b - a)[0]!
    const hostMaxScore = Math.min(maxHostCount / 4, MAX_SCORE)
    const busy = timeDensityScore * 0.6 + hostMaxScore * 0.4

    // focusScore = duration * 0.7 + session * 0.3
    const avgDuration = totalActiveTime / ticks.length
    const avgDurationScore = Math.min(avgDuration / (2 * MILL_PER_MINUTE), MAX_SCORE)
    const sessionScore = computeSessionScore(ticks, Object.keys(hourlyData).length)
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

const Summary = defineComponent<{ data: timer.timeline.Tick[] }>(props => {
    const ticks = computed(() => analyze(props.data))
    watch([ticks], () => console.log(ticks.value))

    return () => (
        <Flex column justify='center' gap={30} height='100%'>
            <Score
                score={ticks.value.busy}
                label={t(msg => msg.dashboard.timeline.busyScore)}
                desc={t(msg => msg.dashboard.timeline.busyScoreDesc)}
            />
            <Score
                score={ticks.value.focus}
                label={t(msg => msg.dashboard.timeline.focusScore)}
                desc={t(msg => msg.dashboard.timeline.focusScoreDesc)}
            />
        </Flex>
    )
}, { props: ['data'] })

export default Summary