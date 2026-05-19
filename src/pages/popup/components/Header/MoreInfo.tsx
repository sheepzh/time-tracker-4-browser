import { createTab } from "@api/chrome/tab"
import { Collection, MoreFilled } from '@element-plus/icons-vue'
import Flex from '@pages/components/Flex'
import { Discord, GitHub, Heart } from '@pages/icons'
import { rateClicked } from '@pages/util/rate'
import { getColor, type ColorVariant } from '@pages/util/style'
import { t } from '@popup/locale'
import { CHANGE_LOG_PAGE, REVIEW_PAGE, SOURCE_CODE_PAGE } from "@util/constant/url"
import { ElDropdown, ElDropdownItem, ElDropdownMenu, ElIcon } from "element-plus"
import { createStringUnionGuard } from 'typescript-guard'
import { defineComponent, type FunctionalComponent, type StyleValue } from "vue"
import { type JSX } from 'vue/jsx-runtime'

type Command = 'github' | 'changelog' | 'rate' | 'discord'

const isCommand = createStringUnionGuard<Command>('github', 'changelog', 'rate', 'discord')

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

const HANDLERS: Record<Command, NoArgCallback> = {
    github: () => createTab(SOURCE_CODE_PAGE),
    changelog: () => createTab(CHANGE_LOG_PAGE),
    rate: () => {
        rateClicked()
        createTab(REVIEW_PAGE)
    },
    discord: () => createTab('https://discord.gg/yXCngD8pKS'),
}

const MoreInfo = defineComponent<{}>(() => {

    return () => (
        <ElDropdown
            size='small'
            trigger='click'
            onCommand={val => isCommand(val) && HANDLERS[val]()}
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
                        <ElDropdownItem command={'discord' satisfies Command} divided>
                            <ItemLink icon={<Discord />} text={t(msg => msg.header.discord)} />
                        </ElDropdownItem>
                        <ElDropdownItem command={'rate' satisfies Command}>
                            <ItemLink icon={<Heart />} text={t(msg => msg.header.rating)} iconColor="danger" />
                        </ElDropdownItem>
                    </ElDropdownMenu>
                )
            }}>
        </ElDropdown>
    )
})

export default MoreInfo