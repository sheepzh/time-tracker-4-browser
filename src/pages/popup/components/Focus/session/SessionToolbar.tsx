import { t } from '@popup/locale'
import { isAlive } from '@util/focus'
import { ElButton } from 'element-plus'
import { defineComponent } from 'vue'
import { useFocusContext } from '../context'

const SessionToolbar = defineComponent<{}>(() => {
    const { session, handleAction: onClick } = useFocusContext()

    return () => {
        const value = session.value
        if (!value) return null
        const { state } = value
        const alive = isAlive(value)
        const allowDelay = value.duration && value.allowDelay

        return <>
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
            <ElButton
                v-show={alive}
                type='danger'
                data-testid='abort-btn'
                onClick={() => onClick('abort')}
            >
                {t(msg => msg.shared.focus.abort)}
            </ElButton>
            <ElButton
                v-show={alive && allowDelay}
                data-testid='delay-btn'
                onClick={() => onClick('delay')}
            >
                {t(msg => msg.focus.button.delay)}
            </ElButton >
            <ElButton
                v-show={!alive}
                type='success'
                data-testid='restart-btn'
                onClick={() => onClick('restart')}
            >
                {t(msg => msg.focus.button.restart)}
            </ElButton>
        </>
    }
})

export default SessionToolbar