import { useRequest } from "@hooks"
import { useCateNameMap } from '@popup/context'
import { HEADER_OPTION_SLOT, TOOLBAR_SLOT } from '@popup/slot'
import { ElCard } from "element-plus"
import { defineComponent, Teleport } from "vue"
import { initStatContext } from '../stat/context'
import StatToolbar from '../stat/StatToolbar'
import Cate from "./Cate"
import PercentageOption from './Option'
import { doQuery } from "./query"
import Site from "./Site"

const Percentage = defineComponent(() => {
    const { query, option } = initStatContext()
    const cateNameMap = useCateNameMap()
    const { data } = useRequest(() => doQuery(query, option, cateNameMap.value), {
        deps: [cateNameMap, () => ({ ...query, ...option })],
    })

    return () => <>
        <Teleport defer to={`#${TOOLBAR_SLOT}`}>
            <StatToolbar />
        </Teleport>
        <Teleport defer to={`#${HEADER_OPTION_SLOT}`}>
            <PercentageOption />
        </Teleport>
        <ElCard
            shadow="never"
            style={{ width: '100%', height: '100%' }}
            bodyStyle={{ height: '100%', boxSizing: 'border-box', padding: 0, overflow: 'hidden' }}
        >
            {query.mergeMethod === 'cate' ? <Cate value={data.value} /> : <Site value={data.value} />}
        </ElCard>
    </>
})

export default Percentage