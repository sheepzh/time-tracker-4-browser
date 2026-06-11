import { Back, Right, VideoPlay } from '@element-plus/icons-vue'
import { isRtl } from '@util/document'
import { ElButton } from 'element-plus'
import { defineComponent } from 'vue'
import { useFocusContext, useFocusSetup } from '../context'

const SetupToolbar = defineComponent<{}>(() => {
    const { session } = useFocusContext()
    const { template, resetTemplate, handleStart } = useFocusSetup()

    return () => !session.value && !!template.value && <>
        <ElButton onClick={resetTemplate} icon={isRtl() ? Right : Back} />
        <ElButton nativeType="submit" type='primary' onClick={handleStart} icon={VideoPlay} />
    </>
})

export default SetupToolbar