import { createTab } from "@api/chrome/tab"
import { Collection, MoreFilled } from '@element-plus/icons-vue'
import Flex from '@pages/components/Flex'
import { GitHub, Heart } from '@pages/icons'
import { rateClicked } from '@pages/util/rate'
import { getColor, type ColorVariant } from '@pages/util/style'
import { t } from '@popup/locale'
import { BUY_ME_A_COFFEE_PAGE, CHANGE_LOG_PAGE, DONATION_PAGE, REVIEW_PAGE, SOURCE_CODE_PAGE } from "@util/constant/url"
import { ElDropdown, ElDropdownItem, ElDropdownMenu, ElIcon } from "element-plus"
import { defineComponent, type FunctionalComponent, type StyleValue } from "vue"
import { type JSX } from 'vue/jsx-runtime'

type Command = 'rate' | 'coffee' | 'donation' | 'github' | 'changelog'

type ItemLinkProps = {
    icon: JSX.Element
    text: string
    iconColor?: ColorVariant
}
const ItemLink: FunctionalComponent<ItemLinkProps> = ({ icon, text, iconColor }) => (
    <Flex gap={2} align='center'>
        <ElIcon color={iconColor ? getColor(iconColor) : undefined}>{icon}</ElIcon>
        {text}
    </Flex>
)

const MoreInfo = defineComponent<{}>(() => {
    const handleCmd = async (cmd: Command) => {
        if (cmd === 'rate') {
            rateClicked()
            createTab(REVIEW_PAGE)
        } else if (cmd === 'coffee') {
            createTab(BUY_ME_A_COFFEE_PAGE)
        } else if (cmd === 'github') {
            createTab(SOURCE_CODE_PAGE)
        } else if (cmd === 'changelog') {
            createTab(CHANGE_LOG_PAGE)
        } else if (cmd === 'donation') {
            createTab(DONATION_PAGE)
        }
    }

    return () => (
        <ElDropdown
            size='small'
            trigger='click'
            onCommand={handleCmd}
            style={{ cursor: 'pointer' } satisfies StyleValue}
            v-slots={{
                default: () => <ElIcon><MoreFilled /></ElIcon>,
                dropdown: () => (
                    <ElDropdownMenu>
                        <ElDropdownItem command={'github' satisfies Command}>
                            <ItemLink icon={<GitHub />} text={t(msg => msg.base.sourceCode)} />
                        </ElDropdownItem>
                        <ElDropdownItem command={'changelog' satisfies Command}>
                            <ItemLink icon={<Collection />} text={t(msg => msg.base.changeLog)} />
                        </ElDropdownItem>
                        <ElDropdownItem command={'rate' satisfies Command} divided>
                            <ItemLink icon={<Heart />} text={t(msg => msg.header.rating)} iconColor="danger" />
                        </ElDropdownItem>
                    </ElDropdownMenu>
                )
            }}>
        </ElDropdown>
    )
})

export default MoreInfo