import Flex from '@pages/components/Flex'
import { t } from '@popup/locale'
import { formatPeriodCommon, MILL_PER_SECOND } from '@util/time'
import { ElProgress, ElTag, ElText, type TagProps } from 'element-plus'
import { computed, defineComponent, type StyleValue } from 'vue'

type Props = {
    session: tt4b.focus.Session
    elapsed: number
}

const PROGRESS_WIDTH = 300

const STATE_TYPES: Record<tt4b.focus.State, TagProps['type']> = {
    running: 'primary',
    paused: 'warning',
    done: 'success',
    aborted: 'danger',
}

const SessionView = defineComponent<Props>(props => {
    const progress = computed<[remaining: number, percent: number] | undefined>(() => {
        const { session: { duration, phase, break: breakDur }, elapsed } = props
        const total: number | undefined = phase === 'focus' ? duration : breakDur
        if (!total) return undefined
        const totalMs = total * MILL_PER_SECOND
        return [
            Math.min(elapsed, totalMs),
            Math.min(elapsed / totalMs * 100, 100),
        ]
    })

    return () => (
        <Flex column align='center' justify='center' flex={1} gap={24} style={{ fontVariantNumeric: 'tabular-nums' }}>
            <Flex align='center' column gap={10}>
                <ElText size='large' tag='b' style={{ fontSize: '32px' }}>
                    {t(msg => msg.shared.focus.method[props.session.method].label)}
                </ElText>
                <ElTag effect='plain' type={STATE_TYPES[props.session.state]} round>
                    {t(msg => msg.shared.focus.state[props.session.state])}
                </ElTag>
            </Flex>
            {progress.value ? (
                <ElProgress
                    type='circle'
                    width={PROGRESS_WIDTH}
                    strokeWidth={35}
                    percentage={progress.value[1]}
                >
                    <Flex column align='center' gap='.8rem'>
                        <ElText style={{ fontSize: '28px', } satisfies StyleValue}>
                            {formatPeriodCommon(progress.value[0])}
                        </ElText>
                        <ElText size='small' type='info'>
                            {progress.value[1].toFixed(1)}%
                        </ElText>
                        <ElTag round effect='light' size='small' type='info'>
                            {t(msg => msg.shared.focus[props.session.phase === 'break' ? 'break' : 'duration'])}
                        </ElTag>
                    </Flex>
                </ElProgress>
            ) : (
                <ElText style={{ fontSize: '32px', marginTop: '30px' } satisfies StyleValue}>
                    {formatPeriodCommon(props.elapsed)}
                </ElText>
            )}
        </Flex>
    )
}, { props: ['session', 'elapsed'] })

export default SessionView
