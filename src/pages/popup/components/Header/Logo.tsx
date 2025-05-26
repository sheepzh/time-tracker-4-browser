import Flex from "@pages/components/Flex"
import { t } from "@popup/locale"
import packageInfo from "@src/package"
import { ElText } from "element-plus"
import type { FunctionalComponent } from "vue"

const Logo: FunctionalComponent = () => (
    <Flex height={30} gap={10}>
        <Flex gap={10} height="100%" align="center">
            <img src="/static/images/icon.png" style={{ height: '100%' }} />
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