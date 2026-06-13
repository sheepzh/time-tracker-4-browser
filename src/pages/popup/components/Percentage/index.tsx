import { useRequest } from "@hooks"
import { useViewSlots } from "@popup/context"
import { ElCard } from "element-plus"
import { defineComponent } from "vue"
import { useStatOption, useStatQuery } from "../stat/context"
import StatToolbar from "../stat/Toolbar"
import Cate from "./Cate"
import PercentageOption from "./Option"
import { doQuery } from "./query"
import Site from "./Site"

const Percentage = defineComponent(() => {
    const query = useStatQuery()
    const option = useStatOption()
    const { setViewSlots } = useViewSlots()
    setViewSlots({ toolbar: StatToolbar, headerOption: PercentageOption })
    const { data } = useRequest(() => doQuery(query, option), { deps: () => ({ ...query, ...option }) })

    return () => (
        <ElCard
            shadow="never"
            style={{ width: '100%', height: '100%' }}
            bodyStyle={{ height: '100%', boxSizing: 'border-box', padding: 0, overflow: 'hidden' }}
        >
            {query.mergeMethod === 'cate'
                ? <Cate value={data.value} />
                : <Site value={data.value} />}
        </ElCard>
    )
})

export default Percentage