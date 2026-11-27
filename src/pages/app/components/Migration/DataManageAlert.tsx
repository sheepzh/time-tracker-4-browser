import { t, type I18nKey } from '@app/locale'
import { Flex } from '@pages/components'
import { ElAlert, type AlertProps } from 'element-plus'
import { type FunctionalComponent } from 'vue'

type Props = {
    type?: AlertProps['type']
    text: I18nKey | string
}

const DataManageAlert: FunctionalComponent<Props> = ({ text, type = 'info' }) => (
    <Flex align="center" boxSizing="border-box" shrink={0} minHeight={52}>
        <ElAlert type={type} closable={false} center style={{ width: '100%' }}>
            {typeof text === 'string' ? text : t(text)}
        </ElAlert>
    </Flex>
)

export default DataManageAlert