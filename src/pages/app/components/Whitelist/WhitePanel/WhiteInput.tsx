/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { t } from "@app/locale"
import { Check, CirclePlus, Close } from "@element-plus/icons-vue"
import { useRequest, useShadow } from "@hooks"
import Box from "@pages/components/Box"
import Flex from '@pages/components/Flex'
import siteService from "@service/site-service"
import { EXCLUDING_PREFIX, isRemainHost } from "@util/constant/remain-host"
import { isValidHost, judgeVirtualFast } from "@util/pattern"
import { ElButton, ElIcon, ElMessage, ElOption, ElSelect, ElTag } from "element-plus"
import { defineComponent, StyleValue } from "vue"

type SearchItem = timer.site.SiteKey & {
    exclude?: boolean
}

async function remoteSearch(query: string): Promise<SearchItem[]> {
    let exclude = false
    if (query?.startsWith(EXCLUDING_PREFIX)) {
        exclude = true
        query = query.slice(1)
    }
    if (!query) return []

    let sites: SearchItem[] = await siteService.selectAll({ fuzzyQuery: query })
    const idx = sites.findIndex(s => s.host === query)

    const target = idx >= 0
        // Move found item to the front
        ? sites.splice(idx, 1)[0]
        // Or create a new one if not found
        : { host: query, type: judgeVirtualFast(query) ? 'virtual' : 'normal' } satisfies SearchItem
    const result = [target, ...sites]

    result.forEach(s => s.exclude = exclude)
    return result
}

type Props = {
    defaultValue?: string
    onSave?: (white: string) => void
    onCancel?: () => void
    end?: boolean
}

const _default = defineComponent<Props>(props => {
    const [white, setWhite, resetWhite] = useShadow(() => props.defaultValue)
    const { data: sites, refresh: search, loading: searching } = useRequest(remoteSearch)

    const handleSubmit = () => {
        const val = white.value
        if (!val) return
        const host = val?.startsWith(EXCLUDING_PREFIX) ? val.substring(1) : val
        if (isRemainHost(host) || isValidHost(host) || judgeVirtualFast(host)) {
            props.onSave?.(val)
        } else {
            ElMessage.warning(t(msg => msg.whitelist.errorInput))
        }
    }
    const handleCancel = () => {
        resetWhite()
        props.onCancel?.()
    }

    return () => (
        <Box style={{ marginInlineEnd: props.end ? 'auto' : undefined }}>
            <ElSelect
                style={{ width: '160px' }}
                modelValue={white.value}
                onChange={setWhite}
                placeholder={t(msg => msg.item.host)}
                clearable
                onClear={() => setWhite(undefined)}
                filterable
                remote
                loading={searching.value}
                remoteMethod={search}
            >
                {sites.value?.map(({ host, type, exclude }) => <ElOption
                    key={`${exclude}${host}`}
                    value={exclude ? `${EXCLUDING_PREFIX}${host}` : host}
                >
                    <Flex gap={2} align='center'>
                        <ElTag v-show={exclude} size="small" type='info'>
                            <ElIcon><CirclePlus /></ElIcon>
                        </ElTag>
                        <span>{host}</span>
                        <ElTag v-show={type === 'virtual'} size="small">
                            {t(msg => msg.siteManage.type.virtual?.name)?.toLocaleUpperCase?.()}
                        </ElTag>
                    </Flex>
                </ElOption>)}
            </ElSelect>
            <ElButton icon={Close} onClick={handleCancel} />
            <ElButton icon={Check} onClick={handleSubmit} style={{ marginInlineStart: 0 } satisfies StyleValue} />
        </Box>
    )
}, { props: ['defaultValue', 'onCancel', 'onSave', 'end'] })

export default _default