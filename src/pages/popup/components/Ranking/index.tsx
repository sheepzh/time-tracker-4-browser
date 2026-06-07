import { useViewSlots } from "@popup/context"
import { useStatOption, useStatQuery } from "../stat/context"
import StatToolbar from "../stat/Toolbar"
import { useRequest } from "@hooks"
import { ElCol, ElRow, ElScrollbar } from "element-plus"
import { defineComponent } from "vue"
import Item from "./Item"
import RankingOption from "./Option"
import { doQuery } from "./query"

const Ranking = defineComponent(() => {
    const query = useStatQuery()
    const option = useStatOption()
    const { setViewSlots } = useViewSlots()
    setViewSlots({ toolbar: StatToolbar, headerOption: RankingOption })
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
