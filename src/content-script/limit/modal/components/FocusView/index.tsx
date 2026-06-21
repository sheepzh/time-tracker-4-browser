import type { FocusReason } from '@cs/limit/types'
import { t } from '@cs/locale'
import Flex from '@pages/components/Flex'
import { ElButton } from 'element-plus'
import { computed, defineComponent, StyleValue } from 'vue'
import { useApp } from '../../context'
import Alert from '../Alert'
import Reason from './Reason'

const FocusView = defineComponent<{ value: FocusReason }>(props => {
    const { bridge } = useApp()

    const prompt = computed(() => props.value.method === 'pomodoro'
        ? t(msg => msg.modal.pomodoroActive)
        : t(msg => msg.modal.focusActive))

    return () => <>
        <Alert prompt={prompt.value} />
        <Reason value={props.value} />
        <Flex justify='center' marginBottom={60}>
            <ElButton
                type="danger"
                data-testid='abort-btn'
                onClick={() => bridge.request('abort', undefined)}
                style={{ marginTop: '16px' } satisfies StyleValue}
            >
                {t(msg => msg.shared.focus.abort)}
            </ElButton>
        </Flex>
    </>
}, { props: ['value'] })

export default FocusView