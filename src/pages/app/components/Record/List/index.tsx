import { t } from '@app/locale'
import { Pointer } from '@element-plus/icons-vue'
import { css } from '@emotion/css'
import { useScrollRequest } from '@hooks'
import { getHost } from "@util/stat"
import { ElButton, ElCard, ElScrollbar, useNamespace } from "element-plus"
import { defineComponent, ref } from "vue"
import { queryPage } from "../common"
import { useRecordFilter } from "../context"
import type { DisplayComponent } from "../types"
import Item from "./Item"

const useStyle = () => {
    const cardNs = useNamespace('card')
    const listCls = css`
        width: 100%;
        display: grid;
        gap: .6em;
        grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));

        & .${cardNs.e('body')} {
            padding: 15px;
        }
    `

    const infoCls = css`
        height: 20px;
        width: 100%;
        text-align: center;
        color: var(--el-text-color-regular);
    `

    return [listCls, infoCls]
}

const _default = defineComponent<{}>((_, ctx) => {
    const filterOption = useRecordFilter()
    const { data, loading, loadMore, end, reset } = useScrollRequest(async (num, size) => {
        const pagination = await queryPage(
            filterOption,
            { order: "descending", prop: "focus" },
            { num, size },
        )
        return pagination.list
    }, { resetDeps: () => ({ ...filterOption }) })

    const selected = ref<number[]>([])

    ctx.expose({
        getSelected: () => selected.value.map(idx => data.value[idx]).filter(i => !!i),
        refresh: reset,
    } satisfies DisplayComponent)

    const handleSelectedChange = (val: boolean, idx: number) => {
        const newSelected = selected.value.filter(v => v !== idx)
        val && newSelected.push(idx)
        return selected.value = newSelected
    }
    const [listCls, infoCls] = useStyle()

    return () => (
        <div>
            <ElScrollbar viewClass={listCls} {...{ onEndReached: loadMore }}>
                {data.value.map((row, idx) => (
                    <ElCard>
                        <Item
                            key={`row-${getHost(row)}-${idx}`}
                            value={row}
                            onSelectedChange={val => handleSelectedChange(val, idx)}
                            onDelete={() => reset()}
                        />
                    </ElCard>
                ))}
                {end.value
                    ? <p class={infoCls}>{t(msg => msg.record.noMore)}</p>
                    : <ElButton text onClick={loadMore} icon={Pointer} loading={loading.value}>More</ElButton>
                }
            </ElScrollbar>
        </div>
    )
})

export default _default