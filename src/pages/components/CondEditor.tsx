import { listSites } from '@api/sw/site'
import { useRequest } from '@hooks'
import Flex from '@pages/components/Flex'
import { EXCLUDING_PREFIX } from '@util/constant/remain-host'
import { judgeVirtualFast } from '@util/pattern'
import { ElAutocomplete, ElMessage, ElScrollbar, ElTag, ElText, type AutocompleteInstance, type TagProps } from 'element-plus'
import { computed, defineComponent, nextTick, ref, type FunctionalComponent, type StyleValue } from 'vue'
import { cvtPxScale } from './common'

const judgeExclude = (url: string): [isExcluding: boolean, cleanUrl: string] => {
    const isExcluding = url.startsWith(EXCLUDING_PREFIX)
    const cleanUrl = isExcluding ? url.substring(EXCLUDING_PREFIX.length) : url
    return [isExcluding, cleanUrl]
}

export function cleanCond(origin: string): string
export function cleanCond(origin: undefined): undefined
export function cleanCond(origin: string | undefined): string | undefined {
    if (!origin) return undefined

    const [isExcluding, clean] = judgeExclude(origin)

    const startIdx = clean.indexOf('//')
    const endIdx = clean.indexOf('?')
    let res = clean.substring(startIdx === -1 ? 0 : startIdx + 2, endIdx === -1 ? undefined : endIdx)
    while (res.endsWith('/')) {
        res = res.substring(0, res.length - 1)
    }
    if (!res) return undefined
    return isExcluding ? `${EXCLUDING_PREFIX}${res}` : res
}

const useSuggestion = () => {
    const { data: allHosts } = useRequest(async () => {
        const sites = await listSites({ types: ['normal', 'virtual'] })
        return sites.map(s => s.host)
    }, { defaultValue: [] })

    const fetchSuggestions = (query: string, callback: (results: { value: string }[]) => void) => {
        const clean = cleanCond(query) ?? query.trim()
        if (!clean) {
            callback(allHosts.value.slice(0, 10).map(value => ({ value })))
            return
        }
        const result: string[] = [clean]
        const slashIdx = clean.indexOf('/')
        if (slashIdx !== -1) {
            const domain = clean.substring(0, slashIdx)
            if (domain !== clean) result.push(domain)
        }
        allHosts.value.forEach(host => {
            if (host.includes(clean) && !result.includes(host)) result.push(host)
        })
        callback(result.slice(0, 10).map(value => ({ value })))
    }
    return { fetchSuggestions }
}

const tagType = (url: string): TagProps['type'] => {
    if (url.startsWith(EXCLUDING_PREFIX)) return 'info'
    if (judgeVirtualFast(url)) return 'warning'
    return 'primary'
}

const CONTAINER_STYLE: StyleValue = {
    borderRadius: 'var(--el-border-radius-base)',
    border: '1px solid var(--el-border-color)',
    backgroundColor: 'var(--el-fill-color-blank)',
}

const AUTOCOMPLETE_STYLE: StyleValue = {
    '--el-input-border-color': 'transparent',
    '--el-input-bg-color': 'transparent',
    '--el-input-hover-border-color': 'transparent',
    '--el-input-focus-border-color': 'transparent',
}

const TagList: FunctionalComponent<{ list: string[], onRemove: ArgCallback<string> }> = ({ list, onRemove }) => (
    <div v-show={list.length} style={{ minHeight: 0, overflow: 'hidden' }}>
        <ElScrollbar height="100%">
            <Flex width="100%" wrap gap={4}>
                {list.map(url => (
                    <ElTag
                        type={tagType(url)}
                        disableTransitions
                        closable
                        onClose={() => onRemove(url)}
                    >
                        {url}
                    </ElTag>
                ))}
            </Flex>
        </ElScrollbar>
    </div>
)

type CondEditorProps = ModelValue<string[]> & {
    tip?: string
    height?: string | number
    placeholder?: string
}

export interface CondEditorInstance {
    focus(): void
}

const sortUrl = (a: string, b: string) => {
    const [aExcluding, aClean] = judgeExclude(a)
    const [bExcluding, bClean] = judgeExclude(b)
    if (aClean === bClean) {
        if (aExcluding && !bExcluding) return 1
        if (!aExcluding && bExcluding) return -1
        return 0
    }
    return aClean.localeCompare(bClean)
}

const CondEditor = defineComponent<CondEditorProps>((props, ctx) => {
    const list = computed(() => [...props.modelValue].sort(sortUrl))
    const inputValue = ref('')
    const { fetchSuggestions } = useSuggestion()

    const autocomplete = ref<AutocompleteInstance>()
    const focus = () => autocomplete.value?.focus()

    const handleAdd = (url: string) => {
        const cleaned = cleanCond(url) ?? url.trim()
        if (!cleaned) return
        if (list.value.includes(cleaned)) {
            ElMessage.warning('URL added already')
            return
        }
        props.onChange?.([...list.value, cleaned])
        inputValue.value = ''
        nextTick(focus)
    }

    const handleRemove = (url: string) => props.onChange?.(list.value.filter(u => u !== url))

    ctx.expose({ focus } satisfies CondEditorInstance)

    return () => (
        <Flex
            class="cond-editor"
            column width="100%" gap={10}
            style={{ height: cvtPxScale(props.height) }}
        >
            <Flex column gap={8} padding={12} style={CONTAINER_STYLE} flex={1}>
                <TagList list={list.value} onRemove={handleRemove} />
                <ElAutocomplete
                    ref={autocomplete}
                    modelValue={inputValue.value}
                    onUpdate:modelValue={val => inputValue.value = String(val)}
                    fetchSuggestions={fetchSuggestions}
                    onSelect={item => typeof item.value === 'string' && handleAdd(item.value)}
                    {...{
                        onKeydown: (ev: Event) => ev instanceof KeyboardEvent && ev.key === 'Enter' && handleAdd(inputValue.value)
                    }}
                    placeholder={props.placeholder}
                    style={AUTOCOMPLETE_STYLE}
                    v-slots={{ prefix: () => <ElText type="info">&gt;</ElText> }}
                />
            </Flex>
            {props.tip && <ElText type="info" size="small" style={{ marginTop: '4px' }}>{props.tip}</ElText>}
        </Flex>
    )
}, { props: ['modelValue', 'onChange', 'tip', 'height', 'placeholder'] })

export default CondEditor