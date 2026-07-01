import { t } from '@app/locale'
import { ElCard, ElOption, ElSelect } from "element-plus"
import { defineComponent, h } from "vue"
import ContentContainer from '../common/ContentContainer'
import { CATE_CONFIG } from './categories'
import { useCategory } from "./useCategory"

const _default = defineComponent<{}>(() => {
    const { category, setCategory } = useCategory()

    return () => (
        <ContentContainer v-slots={{
            filter: () => (
                <ElSelect modelValue={category.value} onChange={setCategory}>
                    {Object.entries(CATE_CONFIG).map(([v, c]) => <ElOption value={v} label={t(c[0])} />)}
                </ElSelect>
            ),
            default: () => <ElCard>{h(CATE_CONFIG[category.value][1])}</ElCard>,
        }} />
    )
})

export default _default