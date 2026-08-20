import { getSitePage } from '@api/sw/site'
import ScrollList from '@app/components/common/ScrollList'
import { useScrollRequest } from '@hooks'
import { defineComponent } from 'vue'
import { useSiteManage } from '../context'
import { DisplayComponent } from '../types'
import Card from './Card'

const List = defineComponent<{}>((_, ctx) => {
    const { filter } = useSiteManage()

    const { data, loadMore, reset, loading, end } = useScrollRequest(async (num, size) => {
        const { query: fuzzyQuery, cateIds, types, host } = filter
        const pagination = await getSitePage({ fuzzyQuery, cateIds, types, host }, { num, size })
        return pagination.list
    }, { resetDeps: () => filter })

    ctx.expose({
        refresh: reset,
        getSelected: () => [],
    } satisfies DisplayComponent)

    return () => (
        <ScrollList
            loadMore={loadMore}
            loading={loading.value}
            end={end.value}
        >
            {data.value.map((row, idx) => (
                <Card key={`row-${row.host}-${idx}`} value={row} onChanged={reset} onDeleted={reset} />
            ))}
        </ScrollList>
    )
})

export default List