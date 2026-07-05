import { APP_OPTION_ROUTE } from '@/shared/route'
import { Warning } from '@element-plus/icons-vue'
import Flex from '@pages/components/Flex'
import { OptionLink } from '@popup/components/Option'
import { t } from '@popup/locale'
import { HEADER_OPTION_SLOT, TOOLBAR_SLOT } from '@popup/slot'
import { getAppPageUrl } from '@util/constant/url'
import { ElCard, ElIcon, ElText } from 'element-plus'
import { defineComponent, FunctionalComponent, Teleport, type StyleValue } from 'vue'
import Calendar from './Calendar'
import { initSiteContext } from './context'
import Limit from './Limit'
import Summary from './Summary'
import Toolbar from './Toolbar'

const NotTrackable: FunctionalComponent<{}> = () => (
    <Flex justify='center' align='center' width='100%' height='100%' column gap={20}>
        <ElText type='info'>
            <ElIcon size={50}><Warning /></ElIcon>
        </ElText>
        <ElText type='info' style={{ fontSize: '30px' }}>
            {t(msg => msg.content.site.notTrackable)}
        </ElText>
    </Flex>
)

const OPTION_URL = getAppPageUrl(APP_OPTION_ROUTE, { i: 'limit' })

const Site = defineComponent<{}>(() => {
    const { tab, trackable } = initSiteContext()

    return () => <>
        <Teleport defer to={`#${TOOLBAR_SLOT}`}>
            <Toolbar />
        </Teleport>
        <Teleport defer to={`#${HEADER_OPTION_SLOT}`}>
            <OptionLink href={OPTION_URL} />
        </Teleport>
        <ElCard shadow='never' style={{ width: '100%' } satisfies StyleValue}>
            <Flex column width='100%' height='100%'>
                <Summary />
                {tab.value === 'limit' && trackable.value && <Limit />}
                {tab.value === 'calendar' && trackable.value && <Calendar />}
                {!trackable.value && <NotTrackable />}
            </Flex>
        </ElCard>
    </>
})

export default Site
