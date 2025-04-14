import { t } from "@app/locale"
import { useScrollRequest } from "@hooks/useScrollRequest"
import statService from "@service/stat-service"
import { ElCard } from "element-plus"
import { computed, defineComponent, ref } from "vue"
import { cvtOption2Param } from "../common"
import { useReportFilter } from "../context"
import type { DisplayComponent } from "../types"
import Item from "./Item"
import "./style"

const _default = defineComponent({
    setup(_, ctx) {
        const filterOption = useReportFilter()
        const param = computed(() => cvtOption2Param(filterOption))

        const { data, loading, loadMoreAsync, end, reset } = useScrollRequest(async (num, size) => {
            const pagination = await statService.selectByPage(param.value, { num, size })
            return pagination?.list
        }, { manual: true, resetDeps: param })

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

        return () => <>
            <div class="report-list-wrapper">
                <div
                    class="report-list"
                    v-infinite-scroll={loadMoreAsync}
                    infinite-scroll-disabled={end.value || loading.value}
                >
                    {data.value?.map((row, idx) => (
                        <ElCard>
                            <Item
                                key={`row-${row.siteKey?.host}-${idx}`}
                                value={row}
                                onSelectedChange={val => handleSelectedChange(val, idx)}
                                onDelete={() => reset()}
                            />
                        </ElCard>
                    ))}
                </div>
                <p class="scroll-info" v-loading={loading.value}>
                    {end.value ? t(msg => msg.report.noMore) : (loading.value ? 'Loading ...' : 'Load More')}
                </p>
            </div>
        </>
    },
})

export default _default