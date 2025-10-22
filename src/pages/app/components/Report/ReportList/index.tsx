import { t } from "@app/locale"
import { css } from '@emotion/css'
import { useScrollRequest } from "@hooks"
import { getHost } from "@util/stat"
import { ElCard, useNamespace } from "element-plus"
import { defineComponent, ref } from "vue"
import { queryPage } from "../common"
import { useReportFilter } from "../context"
import type { DisplayComponent } from "../types"
import Item from "./Item"

const useStyle = () => {
    const cardNs = useNamespace('card')
    const listClz = css`
        width: 100%;
        display: grid;
        gap: .6em;
        grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
        .${cardNs.e('body')} {
            padding: 15px;
        }
    `
    const scrollInfoClz = css`
        height: 20px;
        width: 100%;
        text-align: center;
        color: var(--el-text-color-regular);
    `
    return { listClz, scrollInfoClz }
}

const _default = defineComponent((_, ctx) => {
    const filterOption = useReportFilter()
    const { data, loading, loadMoreAsync, end, reset } = useScrollRequest(async (num, size) => {
        const pagination = await queryPage(
            filterOption,
            { order: "descending", prop: "focus" },
            { num, size },
        )
        return pagination.list
    }, { manual: true, resetDeps: () => ({ ...filterOption }) })

    const selected = ref<number[]>([])

    ctx.expose({
        getSelected: () => selected.value?.map(idx => data.value?.[idx])?.filter(i => !!i) ?? [],
        refresh: reset,
    } satisfies DisplayComponent)

    const handleSelectedChange = (val: boolean, idx: number) => {
        const newSelected = selected.value?.filter(v => v !== idx) || []
        val && newSelected.push(idx)
        return selected.value = newSelected
    }
    const { listClz, scrollInfoClz } = useStyle()

    return () => (
        <div>
            <div class={listClz} v-infinite-scroll={loadMoreAsync} infinite-scroll-disabled={end.value || loading.value}>
                {data.value?.map((row, idx) => (
                    <ElCard>
                        <Item
                            key={`row-${getHost(row)}-${idx}`}
                            value={row}
                            onSelectedChange={val => handleSelectedChange(val, idx)}
                            onDelete={() => reset()}
                        />
                    </ElCard>
                ))}
            </div>
            <p class={scrollInfoClz} v-loading={loading.value}>
                {end.value ? t(msg => msg.report.noMore) : (loading.value ? 'Loading ...' : 'Load More')}
            </p>
        </div>
    )
})

export default _default