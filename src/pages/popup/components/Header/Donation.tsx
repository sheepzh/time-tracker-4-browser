import { createTab } from '@api/chrome/tab'
import { locale } from '@i18n'
import Flex from '@pages/components/Flex'
import { Coffee } from '@pages/icons'
import { BUY_ME_A_COFFEE_PAGE, DONATION_PAGE } from '@util/constant/url'
import { ElIcon, ElTooltip } from 'element-plus'
import { FunctionalComponent } from 'vue'

const Donation: FunctionalComponent<{}> = () => {
    const [content, url] = locale === 'zh_CN'
        ? ['请他喝杯咖啡~', DONATION_PAGE]
        : ['Buy me a coffee', BUY_ME_A_COFFEE_PAGE]

    return (
        <ElTooltip content={content} placement="bottom">
            <Flex onClick={() => createTab(url)} cursor='pointer'>
                <ElIcon size="large" color="var(--el-text-color-primary)">
                    <Coffee />
                </ElIcon>
            </Flex>
        </ElTooltip>
    )
}

export default Donation