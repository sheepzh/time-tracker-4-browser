import { useRequest } from "@hooks/useRequest"
import { useOption, useQuery } from "@popup/context"
import { PieChart } from "echarts/charts"
import { AriaComponent, LegendComponent, TitleComponent, ToolboxComponent, TooltipComponent } from "echarts/components"
import { use } from "echarts/core"
import { CanvasRenderer } from "echarts/renderers"
import { ElCard } from "element-plus"
import { defineComponent } from "vue"
import Cate from "./Cate"
import { doQuery } from "./query"
import Site from "./Site"

use([CanvasRenderer, PieChart, AriaComponent, LegendComponent, TitleComponent, TooltipComponent, ToolboxComponent])

const Percentage = defineComponent(() => {
    const query = useQuery()
    const option = useOption()
    const { data } = useRequest(() => doQuery(query, option), { deps: () => ({ ...query, ...option }) })

    return () => (
        <ElCard
            shadow="never"
            style={{ width: '100%', height: '100%' }}
            bodyStyle={{ height: '100%', boxSizing: 'border-box', padding: 0 }}
        >
            {query.mergeMethod === 'cate'
                ? <Cate value={data.value} />
                : <Site value={data.value} />}
        </ElCard>
    )
})

export default Percentage