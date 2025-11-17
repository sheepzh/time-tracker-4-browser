import { listTabs } from '@api/chrome/tab'
import { t } from '@app/locale'
import { useDebounceState, useRequest } from '@hooks'
import Flex from '@pages/components/Flex'
import { selectAllSites } from '@service/site-service'
import { cleanCond } from '@util/limit'
import { extractHostname, isBrowserUrl } from '@util/pattern'
import { ElMessage, ElSelectV2, ElText, type SelectV2Instance } from 'element-plus'
import { computed, defineComponent, ref, type StyleValue } from 'vue'

type Props = {
    onAdd: (url: string) => string | undefined
}

const fetchAllHosts = async () => {
    const tabs = await listTabs()
    const hostSet = new Set<string>()
    tabs.map(({ url }) => {
        if (!url) return
        const { protocol, host } = extractHostname(url)
        if (protocol === 'https' || protocol === 'http' && !isBrowserUrl(url)) {
            hostSet.add(host)
        }
    })
    const sites = await selectAllSites({ types: ['normal', 'virtual'] })
    sites.forEach(({ host }) => hostSet.add(host))
    return Array.from(hostSet)
}

const useUrlSelect = () => {
    const { data: allHosts } = useRequest(fetchAllHosts)
    const [input, onFilter] = useDebounceState('', 50)
    const inputUrl = computed(() => {
        const inputVal = input.value
        return inputVal ? cleanCond(inputVal) : undefined
    })

    const options = computed(() => {
        const urlVal = inputUrl.value
        const result: string[] = []
        if (urlVal) {
            result.push(urlVal)
            allHosts.value?.forEach(host => host.includes(urlVal) && host !== urlVal && result.push(host))
        } else {
            allHosts.value?.forEach(h => result.push(h))
        }
        return result.map(value => ({ value, label: value }))
    })

    return { options, onFilter }
}

const SiteInput = defineComponent<Props>(props => {
    const { options, onFilter } = useUrlSelect()
    const selectEl = ref<SelectV2Instance>()

    const warnAndFocus = (msg: string) => {
        ElMessage.warning(msg)
        selectEl.value?.focus()
    }

    const handleAdd = (url: string) => {
        const errMsg = props.onAdd(url)
        if (errMsg) {
            return warnAndFocus(errMsg)
        } else {
            selectEl.value?.handleClear()
        }
    }

    return () => (
        <Flex width="100%" column gap={5}>
            <ElSelectV2
                id='site-input' // used for e2e tests
                onChange={handleAdd}
                ref={selectEl} options={options.value}
                filterable filterMethod={onFilter}
                placeholder="e.g. www.demo.com, *.demo.com, demo.com/blog/*, demo.com/**, +www.demo.com/blog/list"
            />
            <ElText style={{ textAlign: 'start', width: '100%', paddingInlineStart: '10px' } satisfies StyleValue}>
                {t(msg => msg.limit.wildcardTip)}
            </ElText>
        </Flex>
    )
}, { props: ['onAdd'] })

export default SiteInput