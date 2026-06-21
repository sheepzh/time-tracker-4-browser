import Flex from '@pages/components/Flex'
import { t } from '@popup/locale'
import { formatPeriodCommon, MILL_PER_SECOND } from '@util/time'
import { ElProgress, ElText } from 'element-plus'
import { computed, defineComponent, onUnmounted, ref, type StyleValue } from 'vue'

type Props = { session: tt4b.focus.Session }

const PROGRESS_WIDTH = 300

const STATE_EMOJI: Record<tt4b.focus.State, string> = {
    running: '🎯',
    paused: '⏸️',
    aborted: '🛑',
    done: '☑️',
}

const SessionView = defineComponent<Props>(props => {
    const now = ref(Date.now())
    const timer = setInterval(() => now.value = Date.now(), 1000)
    onUnmounted(() => clearInterval(timer))

    const elapsed = computed(() => {
        const { session: { state, currentDuration, logs, phase, } } = props
        if (state !== 'running') return currentDuration

        const lastPoint = logs.findLast(
            ({ action: a, phase: p }) => p === phase && (a === 'resume' || a === 'start')
        )
        return currentDuration + (lastPoint ? now.value - lastPoint.ts : 0)
    })

    const progress = computed<[remaining: number, percent: number] | undefined>(() => {
        const { session: { duration, phase, break: breakDur } } = props
        const total: number | undefined = phase === 'focus' ? duration : breakDur
        if (!total) return undefined
        const totalMs = total * MILL_PER_SECOND
        return [
            Math.min(elapsed.value, totalMs),
            Math.min(elapsed.value / totalMs * 100, 100),
        ]
    })

    return () => (
        <Flex column align='center' justify='center' flex={1} gap={24}>
            <ElText size='large' tag='b'>
                {STATE_EMOJI[props.session.state]} {t(msg => msg.focus.state[props.session.state])}
            </ElText>
            {progress.value ? (
                <ElProgress
                    type='circle'
                    width={PROGRESS_WIDTH}
                    strokeWidth={10}
                    percentage={progress.value[1]}
                >
                    <Flex column align='center' gap='.8rem'>
                        <ElText style={{ fontSize: '28px', fontVariantNumeric: 'tabular-nums' } satisfies StyleValue}>
                            {formatPeriodCommon(progress.value[0])}
                        </ElText>
                        <ElText size='small' type='info'>
                            {progress.value[1].toFixed(1)}%
                        </ElText>
                    </Flex>
                </ElProgress>
            ) : (
                <ElText style={{ fontSize: '32px', fontVariantNumeric: 'tabular-nums' } satisfies StyleValue}>
                    {formatPeriodCommon(elapsed.value)}
                </ElText>
            )}
        </Flex>
    )
}, { props: ['session'] })

export default SessionView
