import packageInfo from "@/package"
import { getIconUrl } from '@api/chrome/runtime'
import { Flex, Img } from '@pages/components'
import { t } from '@popup/locale'
import { ElText } from "element-plus"
import type { FunctionalComponent } from "vue"

const Logo: FunctionalComponent = () => (
    <Flex height={30} gap={10}>
        <Flex gap={10} height="100%" align="center">
            <Img src={getIconUrl()} style={{ height: '100%' }} />
            <ElText size="large" tag="b" style={{ color: 'var(--el-text-color-primary)' }}>
                {t(msg => msg.meta.name)}
            </ElText>
        </Flex>
        <Flex align="end" style={{ marginBottom: '-1px' }}>
            <ElText type="info" size="small" tag="div">
                v{packageInfo.version}
            </ElText>
        </Flex>
    </Flex>
)

export default Logo