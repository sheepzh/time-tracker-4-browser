import type { FocusReason } from '@cs/limit/types'
import { t } from '@cs/locale'
import ConfirmButton from '@pages/components/ConfirmButton'
import Flex from '@pages/components/Flex'
import { ElTag } from 'element-plus'
import { defineComponent } from 'vue'
import { useApp } from '../../context'
import Alert from '../Alert'
import Reason from './Reason'

const FocusView = defineComponent<{ value: FocusReason }>(props => {
    const { bridge } = useApp()

    return () => <>
        <Alert>
            <Flex gap={10} column align='center'>
                {t(msg => msg.focus.method[props.value.method].label)}
                <ElTag size='small' effect='plain'>
                    {t(msg => msg.focus.state[props.value.state])}
                </ElTag>
            </Flex>
        </Alert>
        <Reason value={props.value} />
        <Flex justify='center' marginBottom={60} marginTop={16}>
            <ConfirmButton
                buttonText={t(msg => msg.focus.button.stop)}
                buttonProps={{ type: 'danger' }}
                onConfirm={() => bridge.request('stop', undefined)}
                data-testid='stop-btn'
            />
        </Flex>
    </>
}, { props: ['value'] })

export default FocusView