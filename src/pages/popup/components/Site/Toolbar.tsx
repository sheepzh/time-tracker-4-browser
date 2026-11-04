import { Calendar, Timer } from '@element-plus/icons-vue'
import { Flex, IconRadioGroup } from '@pages/components'
import { t } from '@popup/locale'
import { defineComponent } from 'vue'
import { SITE_TOOLBAR_SLOT } from './common'
import { isSiteTab, useTab } from './context'

const Toolbar = defineComponent<{}>(() => {
    const tab = useTab()
    const setTab = (val: unknown) => isSiteTab(val) && (tab.value = val)

    return () => (
        <Flex gap={8} justify='end'>
            <Flex id={SITE_TOOLBAR_SLOT} />
            <IconRadioGroup
                modelValue={tab.value}
                onChange={setTab}
                options={[{
                    value: 'calendar',
                    tooltip: t(msg => msg.content.site.daily),
                    icon: Calendar,
                }, {
                    value: 'limit',
                    tooltip: t(msg => msg.base.limit),
                    icon: Timer,
                }]}
            />
        </Flex>
    )
})

export default Toolbar