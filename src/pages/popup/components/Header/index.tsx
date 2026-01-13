import { createTab, listTabs, updateTab } from "@api/chrome/tab"
import { View } from "@element-plus/icons-vue"
import Flex from "@pages/components/Flex"
import LangSelect from "@popup/components/Header/LangSelect"
import { t } from "@popup/locale"
import { IS_ANDROID } from "@util/constant/environment"
import { getAppPageUrl } from "@util/constant/url"
import { ElLink } from "element-plus"
import { FunctionalComponent } from "vue"
import Coffee from './Coffee'
import DarkSwitch from "./DarkSwitch"
import Github from "./Github"
import Logo from "./Logo"
import Option from "./Option"
import RateUs from './RateUs'

const openAppPage = async () => {
    const appPageUrl = getAppPageUrl()
    if (IS_ANDROID) return location.replace(appPageUrl)
    try {
        const tabs = await listTabs({ currentWindow: true })
        // If there are non-highlighted app page tab, jump to it
        const tabId2Jump = tabs.find(tab => !!tab.url?.startsWith(appPageUrl) && !tab.highlighted)?.id
        if (tabId2Jump) {
            await updateTab(tabId2Jump, { highlighted: true, active: true })
            return
        }
    } catch (ignored) {
    }
    // fall back to open new tab
    await createTab(appPageUrl)
}

const Header: FunctionalComponent = () => (
    <Flex justify="space-between" padding='0 10px' color='text-primary'>
        <Flex gap={4}>
            <Logo />
            <Coffee />
        </Flex>
        <Flex gap={10}>
            <Flex gap={10}>
                <RateUs />
                <ElLink underline="never" onClick={openAppPage} icon={View} style={{ gap: '3px' }}>
                    {t(msg => msg.base.allFunction)}
                </ElLink>
            </Flex>
            <Flex align="center" gap={8} fontSize={30}>
                <LangSelect />
                <DarkSwitch />
                <Option />
                <Github />
            </Flex>
        </Flex>
    </Flex>
)

Header.displayName = "PopupHeader"

export default Header