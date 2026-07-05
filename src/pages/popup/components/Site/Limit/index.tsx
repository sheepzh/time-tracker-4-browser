import { APP_LIMIT_ROUTE, AppLimitQuery } from '@/shared/route'
import { createTab } from '@api/chrome/tab'
import { getLimitSummary } from '@api/sw/limit'
import { Edit, Plus } from '@element-plus/icons-vue'
import { useRequest } from '@hooks'
import Flex from '@pages/components/Flex'
import { t } from '@popup/locale'
import { isNotTrackable } from '@util/constant/environment'
import { getAppPageUrl } from '@util/constant/url'
import { extractHostname } from '@util/pattern'
import { ElButton, ElResult, ElSelect } from 'element-plus'
import { computed, CSSProperties, defineComponent, ref, Teleport, type FunctionalComponent } from 'vue'
import { SITE_TOOLBAR_SLOT } from '../common'
import Chart from './Chart'

const Empty: FunctionalComponent<{}> = () => (
    <Flex column align="center" justify="center" height='100%' gap={20}>
        <ElResult icon='info' title={t(msg => msg.content.limit.noData)} />
    </Flex>
)

const Limit = defineComponent<{}>(() => {
    const selected = ref<number>()
    const { data: summary, loading } = useRequest(getLimitSummary, {
        onSuccess: ({ items }) => {
            if (!items.some(i => i.id !== selected.value)) {
                selected.value = items[0]?.id
            }
        }
    })
    const items = computed(() => summary.value?.items ?? [])
    const item = computed(() => summary.value?.items.find(i => i.id === selected.value))

    const handleNew = async () => {
        let url = summary.value?.url
        const query: AppLimitQuery = { action: 'create' }
        if (url && !isNotTrackable(url)) {
            const { host } = extractHostname(url)
            query.url = encodeURIComponent(host)
        }
        await createTab(getAppPageUrl(APP_LIMIT_ROUTE, query))
    }

    const handleEdit = async () => {
        if (!selected.value) return
        const query: AppLimitQuery = { action: 'modify', id: String(selected.value) }
        await createTab(getAppPageUrl(APP_LIMIT_ROUTE, query))
    }

    return () => <>
        <Teleport defer to={`#${SITE_TOOLBAR_SLOT}`}>
            {!!items.value.length && (
                <Flex gap={4}>
                    <ElSelect
                        modelValue={selected.value}
                        onChange={val => typeof val === 'number' && (selected.value = val)}
                        options={items.value.map(i => ({ value: i.id, label: i.name }))}
                        style={{ width: '140px' } satisfies CSSProperties}
                    />
                    <ElButton
                        icon={Edit}
                        onClick={handleEdit}
                        style={{ width: '40px' } satisfies CSSProperties}
                    />
                </Flex>
            )}
            {!loading.value && !items.value.length && (
                <ElButton type='primary' icon={Plus} onClick={handleNew}>
                    {t(msg => msg.content.limit.newOne)}
                </ElButton>
            )}
        </Teleport>
        {item.value ? <Chart item={item.value} /> : <Empty />}
    </>
})

export default Limit