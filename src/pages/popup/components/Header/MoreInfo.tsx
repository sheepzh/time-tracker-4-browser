import { createTab } from "@api/chrome/tab"
import { Collection, MagicStick, MoreFilled } from '@element-plus/icons-vue'
import Flex from '@pages/components/Flex'
import { Bug, Discord, GitHub, Heart } from '@pages/icons'
import { rateClicked } from '@pages/util/rate'
import { getColor, type ColorVariant } from '@pages/util/style'
import { t, type I18nKey } from '@popup/locale'
import {
    CHANGE_LOG_PAGE, GITHUB_ISSUE_BUG, GITHUB_ISSUE_FEATURE, REVIEW_PAGE, SOURCE_CODE_PAGE,
} from "@util/constant/url"
import { ElDropdown, ElDropdownItem, ElDropdownMenu, ElIcon } from "element-plus"
import { createStringUnionGuard } from 'typescript-guard'
import { h, type Component, type FunctionalComponent, type StyleValue } from "vue"

const ALL_CMDS = ['github', 'changelog', 'rate', 'discord', 'bug', 'feature'] as const

type Command = typeof ALL_CMDS[number]

const isCommand = createStringUnionGuard<Command>(...ALL_CMDS)

type ItemLinkProps = {
    icon: Component
    text: string
    iconColor?: ColorVariant
}
const ItemLink: FunctionalComponent<ItemLinkProps> = ({ icon, text, iconColor }) => (
    <Flex gap={2} align='center'>
        <ElIcon color={iconColor ? getColor(iconColor) : undefined}>{h(icon)}</ElIcon>
        {text}
    </Flex>
)

type Config = ItemLinkProps & {
    handler: NoArgCallback
}

const createConfig = (text: I18nKey, icon: Component, url: string): Config => ({
    text: t(text),
    icon,
    handler: () => createTab(url)
})

const REGISTRY: Record<Command, Config> = {
    github: createConfig(msg => msg.base.sourceCode, GitHub, SOURCE_CODE_PAGE),
    changelog: createConfig(msg => msg.base.changeLog, Collection, CHANGE_LOG_PAGE),
    rate: {
        text: t(msg => msg.header.rating),
        icon: Heart,
        iconColor: "danger",
        handler: () => {
            rateClicked()
            createTab(REVIEW_PAGE)
        }
    },
    discord: createConfig(msg => msg.header.discord, Discord, 'https://discord.gg/yXCngD8pKS'),
    bug: createConfig(msg => msg.header.bug, Bug, GITHUB_ISSUE_BUG),
    feature: createConfig(msg => msg.header.feature, MagicStick, GITHUB_ISSUE_FEATURE),
}

const ITEMS: Command[][] = [
    ['github', 'changelog', 'bug', 'feature'],
    ['discord', 'rate']
]

const MoreInfo: FunctionalComponent<{}> = () => (
    <ElDropdown
        size='small'
        trigger='click'
        onCommand={val => isCommand(val) && REGISTRY[val].handler()}
        style={{ cursor: 'pointer' } satisfies StyleValue}
        v-slots={{
            default: () => <ElIcon><MoreFilled /></ElIcon>,
            dropdown: () => (
                <ElDropdownMenu>
                    {ITEMS.flatMap((g, gi) => g.map((cmd, ci) => (
                        <ElDropdownItem key={cmd} command={cmd} divided={!ci && !!gi}>
                            <ItemLink {...REGISTRY[cmd]} />
                        </ElDropdownItem>
                    )))}
                </ElDropdownMenu>
            )
        }}>
    </ElDropdown>
)
MoreInfo.displayName = 'MoreInfo'

export default MoreInfo