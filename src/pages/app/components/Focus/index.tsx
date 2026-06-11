import { t } from '@app/locale'
import Flex from '@pages/components/Flex'
import { ElButton } from 'element-plus'
import { defineComponent } from 'vue'
import ContentContainer from '../common/ContentContainer'
import Content from './Content'
import { initFocusManage } from './context'
import Modify from './Modify'

const Focus = defineComponent(() => {
    const { modifyInst } = initFocusManage()

    return () => (
        <ContentContainer v-slots={{
            filter: () => (
                <Flex justify='end'>
                    <ElButton type='primary' onClick={() => modifyInst.value?.create()}>
                        {t(msg => msg.button.create)}
                    </ElButton>
                </Flex>
            ),
            default: () => <>
                <Content />
                <Modify ref={modifyInst} />
            </>,
        }} />
    )
})

export default Focus