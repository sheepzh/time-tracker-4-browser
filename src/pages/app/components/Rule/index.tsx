import { t } from '@app/locale'
import { ElTabPane, ElTabs } from 'element-plus'
import { createStringUnionGuard } from 'typescript-guard'
import { computed, defineComponent, type StyleValue } from 'vue'
import { useRoute, useRouter, type LocationQuery } from 'vue-router'
import ContentContainer from '../common/ContentContainer'
import Merge from './Merge'
import Whitelist from './Whitelist'

type RuleTab = 'white' | 'merge'
const isTab = createStringUnionGuard<RuleTab>('white', 'merge')

const PARAM = "i"

export const useTab = () => {
    const route = useRoute()
    const router = useRouter()

    const tab = computed<RuleTab, RuleTab>({
        set(value: RuleTab) {
            const oldQuery = route.query
            const query: LocationQuery = {
                ...oldQuery,
                [PARAM]: value,
            }
            router.replace({ query })
        },
        get() {
            const query = route.query[PARAM]
            const queryVal = Array.isArray(query) ? query[0] : query
            return isTab(queryVal) ? queryVal : 'white'
        },
    })

    const setTab = (value: unknown) => isTab(value) && (tab.value = value)

    return { tab, setTab }
}

const Rule = defineComponent<{}>(() => {
    const { tab, setTab } = useTab()

    return () => (
        <ContentContainer>
            <ElTabs
                modelValue={tab.value}
                onTabChange={setTab}
                type='border-card'
                style={{ flex: 1 } satisfies StyleValue}
            >
                <ElTabPane name='white' label={t(msg => msg.rule.white.label)}>
                    <Whitelist />
                </ElTabPane>
                <ElTabPane name='merge' label={t(msg => msg.rule.merge.label)}>
                    <Merge />
                </ElTabPane>
            </ElTabs>
        </ContentContainer>
    )
})

export default Rule