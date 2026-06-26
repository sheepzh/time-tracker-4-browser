import ConfirmButton from '@pages/components/ConfirmButton'
import { t } from '@popup/locale'
import { isAlive } from '@util/focus'
import { ElButton } from 'element-plus'
import { defineComponent } from 'vue'
import { useFocusSession } from '../context'

const SessionToolbar = defineComponent<{}>(() => {
    const { session, handleAction: onClick } = useFocusSession()

    return () => {
        const value = session.value
        if (!value) return null
        const { state } = value
        const alive = isAlive(value)
        const allowDelay = value.duration && value.allowDelay

        return <>
            <ElButton
                v-show={alive && allowDelay}
                data-testid='delay-btn'
                type='success'
                onClick={() => onClick('delay')}
            >
                {t(msg => msg.focus.button.delay)}
            </ElButton>
            <ElButton
                v-show={state === 'paused'}
                data-testid='resume-btn'
                type='primary'
                onClick={() => onClick('resume')}
            >
                {t(msg => msg.focus.button.resume)}
            </ElButton>
            <ElButton
                v-show={state === 'running'}
                data-testid='pause-btn'
                onClick={() => onClick('pause')}
            >
                {t(msg => msg.focus.button.pause)}
            </ElButton>
            <ConfirmButton
                buttonText={t(msg => msg.focus.button.stop)}
                visible={alive}
                buttonProps={{ type: 'danger' }}
                data-testid='stop-btn'
                onConfirm={() => onClick('stop')}
            />
            <ElButton
                v-show={!alive}
                type='info'
                data-testid='dismiss-btn'
                onClick={() => onClick('dismiss')}
            >
                {t(msg => msg.focus.button.dismiss)}
            </ElButton>
        </>
    }
})

export default SessionToolbar