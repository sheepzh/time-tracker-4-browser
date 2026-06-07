import { APP_OPTION_ROUTE } from '@/shared/route'
import Flex from '@pages/components/Flex'
import { useViewSlots } from '@popup/context'
import { getAppPageUrl } from '@util/constant/url'
import { ElCard } from 'element-plus'
import { defineComponent, type StyleValue } from 'vue'
import Option from "../Option"
import Content from './Content'
import Summary from './Summary'
import LimitToolbar from './Toolbar'

const OPTION_URL = getAppPageUrl(APP_OPTION_ROUTE, { i: 'limit' })

const Limit = defineComponent(() => {
    const { setViewSlots } = useViewSlots()
    setViewSlots({ toolbar: LimitToolbar, headerOption: <Option.Link href={OPTION_URL} /> })

    return () => (
        <ElCard shadow='never' style={{ width: '100%' } satisfies StyleValue}>
            <Flex column width='100%' height='100%'>
                <Summary />
                <Content />
            </Flex>
        </ElCard>
    )
})

export default Limit
