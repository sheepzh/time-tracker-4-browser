import { t } from '@app/locale'
import Flex from '@pages/components/Flex'
import { ElButton } from 'element-plus'
import { defineComponent } from 'vue'
import ContentCard from '../common/ContentCard'
import ContentContainer from '../common/ContentContainer'
import { initFocusManage } from './context'
import Modify from './Modify'
import Table from './Table'

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
                <ContentCard><Table /></ContentCard>
                <Modify ref={modifyInst} />
            </>,
        }} />
    )
})

export default Focus