import type { FocusReason } from '@cs/limit/types'
import { t } from '@cs/locale'
import Flex from '@pages/components/Flex'
import { ElButton } from 'element-plus'
import { computed, defineComponent, StyleValue } from 'vue'
import { useApp } from '../context'

const FocusView = defineComponent<{ value: FocusReason }>(props => {
    const { bridge } = useApp()

    const template = computed(() => props.value.template)
    // const mode = computed(() => props.value.mode)
    // const cond = computed(() => props.value.cond)

    // const matchedConds = computed(() => new Set(matchCond(cond.value ?? [], url)))
    const title = computed(() => template.value === 'pomodoro'
        ? t(msg => msg.modal.pomodoroActive)
        : t(msg => msg.modal.focusActive))
    // const condLabel = computed(() => t(msg => msg.shared.focus.mode[mode.value].label))

    return () => (
        <Flex column align='center' justify='center' gap={24} padding="40px 20px">
            <Flex as='h2' align='center' gap={8} fontSize='1.8rem' margin={0}>
                <span>{template.value === 'pomodoro' ? '🍅' : '🎯'}</span>
                <span>{title.value}</span>
            </Flex>

            <p style={{ fontSize: '1.2rem', textAlign: 'center' }}>
                {t(msg => msg.modal.focusBlocked)}
            </p>
            {/* todo: show description */}
            <ElButton
                type="warning"
                onClick={() => bridge.request('abort', undefined)}
                style={{ marginTop: '16px' } satisfies StyleValue}
            >
                {t(msg => msg.shared.focus.abort)}
            </ElButton>
        </Flex>
    )
}, { props: ['value'] })

export default FocusView