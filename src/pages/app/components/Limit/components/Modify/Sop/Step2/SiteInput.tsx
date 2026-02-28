import { listTabs } from '@api/chrome/tab'
import { t } from '@app/locale'
import { useDebounceState, useRequest } from '@hooks'
import Flex from '@pages/components/Flex'
import { selectAllSites } from '@service/site-service'
import { cleanCond } from '@util/limit'
import { extractHostname, isBrowserUrl } from '@util/pattern'
import { ElMessage, ElSelectV2, ElText, useNamespace, type SelectV2Instance } from 'element-plus'
import { computed, defineComponent, onMounted, ref, type StyleValue } from 'vue'

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

const useUrlSelect = ({ onAdd }: Props) => {
    const { data: allHosts } = useRequest(fetchAllHosts)
    const [input, onFilter] = useDebounceState('', 50)
    const inputUrl = computed(() => {
        const clean = cleanCond(input.value)
        if (!clean) return {}
        const slashIdx = clean.indexOf('/')
        return slashIdx === -1 ? { full: clean } : { full: clean, domain: clean.substring(0, slashIdx) }
    })

    const options = computed(() => {
        const { full, domain } = inputUrl.value
        const result: string[] = []
        if (full) {
            result.push(full)
            domain && result.push(domain)
            allHosts.value?.forEach(host => host.includes(full) && host !== full && host !== domain && result.push(host))
        } else {
            allHosts.value?.forEach(h => result.push(h))
        }
        return result.map(value => ({ value, label: value }))
    })

    const selectInst = ref<SelectV2Instance>()

    const warnAndFocus = (msg: string) => {
        ElMessage.warning(msg)
        selectInst.value?.focus()
    }

    const onSelected = (url: string) => {
        const errMsg = onAdd(url)
        if (errMsg) {
            return warnAndFocus(errMsg)
        } else {
            selectInst.value?.handleClear()
        }
    }

    const selectNs = useNamespace('select')

    onMounted(() => {
        const el = (selectInst.value?.$el as HTMLDivElement)
        if (!el) return
        const input = el.querySelector('input')
        input?.addEventListener('keyup', ev => {
            if (ev.code !== 'Enter') return
            console.log(`.${selectNs.be('dropdown', 'item')}.is-hovering`)
            const hovered = el.querySelector(`.${selectNs.be('dropdown', 'item')}.is-hovering`)
            const first = options.value[0]?.value
            if (!hovered && first) {
                onSelected(first)
                ev.stopImmediatePropagation()
            }
        })
    })

    return {
        options, onFilter, onSelected,
        selectInst,
    }
}

const SiteInput = defineComponent<Props>(props => {
    const { options, onFilter, onSelected, selectInst } = useUrlSelect(props)

    return () => (
        <Flex width="100%" column gap={5}>
            <ElSelectV2
                id='site-input' // used for e2e tests
                onChange={onSelected}
                ref={selectInst} options={options.value}
                filterable filterMethod={onFilter}
                teleported={false} // not teleported, need to find hovered item
                placeholder="e.g. www.demo.com, *.demo.com, demo.com/blog/*, demo.com/**, +www.demo.com/blog/list"
            />
            <ElText style={{ textAlign: 'start', width: '100%', paddingInlineStart: '10px' } satisfies StyleValue}>
                {t(msg => msg.limit.wildcardTip)}
            </ElText>
        </Flex>
    )
}, { props: ['onAdd'] })

export default SiteInput