import type { FocusReason } from '@cs/limit/types'
import { t } from '@cs/locale'
import Flex from '@pages/components/Flex'
import { ElButton, ElTag } from 'element-plus'
import { defineComponent, StyleValue } from 'vue'
import { useApp } from '../../context'
import Alert from '../Alert'
import Reason from './Reason'

const FocusView = defineComponent<{ value: FocusReason }>(props => {
    const { bridge } = useApp()

    return () => <>
        <Alert>
            <Flex gap={10} column align='center'>
                {t(msg => msg.focus.method[props.value.method])}
                <ElTag size='small' effect='plain'>
                    {t(msg => msg.focus.state[props.value.state])}
                </ElTag>
            </Flex>
        </Alert>
        <Reason value={props.value} />
        <Flex justify='center' marginBottom={60}>
            <ElButton
                type="danger"
                data-testid='abort-btn'
                onClick={() => bridge.request('abort', undefined)}
                style={{ marginTop: '16px' } satisfies StyleValue}
            >
                {t(msg => msg.focus.button.abort)}
            </ElButton>
        </Flex>
    </>
}, { props: ['value'] })

export default FocusView