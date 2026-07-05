import { Calendar, Timer } from '@element-plus/icons-vue'
import Flex from '@pages/components/Flex'
import IconRadioGroup, { type IconRadioOption } from '@pages/components/IconRadioGroup'
import { t } from '@popup/locale'
import { defineComponent } from 'vue'
import { SITE_TOOLBAR_SLOT } from './common'
import { isSiteTab, type SiteTab, useTab } from './context'

const OPTIONS: IconRadioOption<SiteTab>[] = [{
    value: 'calendar',
    tooltip: t(msg => msg.content.site.daily),
    icon: Calendar,
}, {
    value: 'limit',
    tooltip: t(msg => msg.base.limit),
    icon: Timer,
}]

const Toolbar = defineComponent<{}>(() => {
    const tab = useTab()
    const setTab = (val: unknown) => isSiteTab(val) && (tab.value = val)

    return () => (
        <Flex gap={8} justify='end'>
            <Flex id={SITE_TOOLBAR_SLOT} />
            <IconRadioGroup modelValue={tab.value} onChange={setTab} options={OPTIONS} />
        </Flex>
    )
})

export default Toolbar