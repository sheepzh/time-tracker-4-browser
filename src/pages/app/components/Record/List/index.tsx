import ScrollList from '@app/components/common/ScrollList'
import { t } from '@app/locale'
import { useScrollRequest } from '@hooks'
import { Flex } from '@pages/components'
import { getHost } from "@util/stat"
import { ElText } from 'element-plus'
import { defineComponent, ref } from "vue"
import { queryPage } from "../common"
import { useRecordFilter, useSummary } from "../context"
import type { DisplayComponent } from "../types"
import Card from './Card'

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

    const summary = useSummary(true)
    const selected = ref<number[]>([])

    ctx.expose({
        getSelected: () => selected.value.map(idx => data.value[idx]).filter(i => !!i),
        refresh: reset,
    } satisfies DisplayComponent)

    const handleSelectedChange = (val: boolean, idx: number) => {
        const newSelected = selected.value.filter(v => v !== idx)
        val && newSelected.push(idx)
        selected.value = newSelected
        return newSelected
    }

    return () => (
        <Flex column gap={10}>
            <ElText size='small' type='info'>
                {t(msg => msg.record.total, { ...summary.data.value })}
            </ElText>
            <ScrollList
                minWidth={250}
                end={end.value}
                loadMore={loadMore}
                loading={loading.value}
            >
                {data.value.map((row, idx) => (
                    <Card
                        key={`row-${getHost(row)}-${idx}`}
                        value={row}
                        onSelectedChange={val => handleSelectedChange(val, idx)}
                        onDelete={() => reset()}
                    />
                ))}
            </ScrollList>
        </Flex>
    )
})

export default _default