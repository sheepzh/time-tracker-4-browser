import { useRequest } from "@hooks"
import { ElCard } from "element-plus"
import { defineComponent } from "vue"
import { useOption, useQuery } from "../../context"
import Cate from "./Cate"
import { doQuery } from "./query"
import Site from "./Site"

const Percentage = defineComponent(() => {
    const query = useQuery()
    const option = useOption()
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