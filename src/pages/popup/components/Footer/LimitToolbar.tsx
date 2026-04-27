import { APP_LIMIT_ROUTE, AppLimitQuery } from '@/shared/route'
import { createTab } from '@api/chrome/tab'
import { Plus } from '@element-plus/icons-vue'
import Flex from '@pages/components/Flex'
import { useLimitSummary } from '@popup/context'
import { t } from '@popup/locale'
import { getAppPageUrl } from '@util/constant/url'
import { isBrowserUrl } from '@util/pattern'
import { ElButton, ElSelect } from 'element-plus'
import { computed, defineComponent, type StyleValue } from 'vue'

const findHost = (url: string) => {
    try {
        return new URL(url).host
    } catch {
        return url
    }
}

const LimitToolbar = defineComponent(() => {
    const { limitSummary, selectedLimit } = useLimitSummary()
    const items = computed(() => limitSummary.value?.items || [])

    const handleNew = async () => {
        let url = limitSummary.value?.url
        const query: AppLimitQuery = { action: 'create' }
        if (url && !isBrowserUrl(url)) {
            const host = findHost(url)
            query.url = encodeURIComponent(host)
        }
        await createTab(getAppPageUrl(APP_LIMIT_ROUTE, query))
    }

    return () => (
        <Flex gap={8} justify='end'>
            {items.value.length ? (
                <ElSelect
                    modelValue={selectedLimit.value}
                    onChange={val => typeof val === 'number' && (selectedLimit.value = val)}
                    options={items.value.map(i => ({ value: i.id, label: i.name }))}
                    style={{ width: '140px' } satisfies StyleValue}
                />
            ) : (
                <ElButton type='primary' icon={Plus} onClick={handleNew}>
                    {t(msg => msg.limit.newOne)}
                </ElButton>
            )}
        </Flex>
    )
})

export default LimitToolbar