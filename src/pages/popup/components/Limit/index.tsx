import { APP_OPTION_ROUTE } from '@/shared/route'
import Flex from '@pages/components/Flex'
import { OptionLink } from '@popup/components/Option'
import { HEADER_OPTION_SLOT, TOOLBAR_SLOT } from '@popup/slot'
import { getAppPageUrl } from '@util/constant/url'
import { ElCard } from 'element-plus'
import { defineComponent, Teleport, type StyleValue } from 'vue'
import Content from './Content'
import { initLimitContext } from './context'
import Summary from './Summary'
import Toolbar from './Toolbar'

const OPTION_URL = getAppPageUrl(APP_OPTION_ROUTE, { i: 'limit' })

const Limit = defineComponent<{}>(() => {
    initLimitContext()

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
                <Content />
            </Flex>
        </ElCard>
    </>
})

export default Limit
