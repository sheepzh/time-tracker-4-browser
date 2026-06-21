import { Back, Right, VideoPlay } from '@element-plus/icons-vue'
import { isRtl } from '@util/document'
import { ElButton } from 'element-plus'
import { defineComponent } from 'vue'
import { useFocusContext, useFocusSetup } from '../context'

const SetupToolbar = defineComponent<{}>(() => {
    const { session } = useFocusContext()
    const { method, handleStart } = useFocusSetup()

    return () => !session.value && !!method.value && <>
        <ElButton
            onClick={() => method.value = undefined}
            icon={isRtl() ? Right : Back}
        />
        <ElButton
            data-testid='start-btn' nativeType='submit'
            type='primary' icon={VideoPlay}
            onClick={handleStart}
        />
    </>
})

export default SetupToolbar