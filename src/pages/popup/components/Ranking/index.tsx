import { useRequest } from "@hooks/useRequest"
import { useOption, useQuery } from "@popup/context"
import { ElCol, ElRow, ElScrollbar } from "element-plus"
import { defineComponent } from "vue"
import Item from "./Item"
import { doQuery } from "./query"

const Ranking = defineComponent(() => {
    const query = useQuery()
    const option = useOption()
    const { data: result } = useRequest(() => doQuery(query, option), { deps: () => ({ ...query, ...option }) })

    return () => (
        <ElScrollbar noresize style={{ width: '100%' }}>
            <ElRow gutter={10} style={{ rowGap: '10px' }}>
                {result.value?.rows?.map(row => (
                    <ElCol span={24 / 3}>
                        <Item
                            value={row}
                            max={result.value?.max}
                            total={result.value?.total}
                            date={result.value?.date}
                            displaySiteName={result.value?.displaySiteName}
                        />
                    </ElCol>
                ))}
            </ElRow>
        </ElScrollbar>
    )
})

export default Ranking
