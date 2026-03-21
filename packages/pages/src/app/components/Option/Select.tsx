import { ElCard, ElOption, ElSelect } from "element-plus"
import { defineComponent, h, useSlots } from "vue"
import ContentContainer from "../ContentContainer"
import { useCategory } from "./useCategory"

const _default = defineComponent(() => {
    const { category, setCategory, getLabel } = useCategory()
    const slots = useSlots()

    return () => (
        <ContentContainer v-slots={{
            filter: () => (
                <ElSelect modelValue={category.value} onChange={setCategory}>
                    {Object.keys(slots).map(c => <ElOption value={c} label={getLabel(c)} />)}
                </ElSelect>
            ),
            default: () => {
                const slot = slots[category.value]
                return !!slot && <ElCard style={{ "--el-card-padding": '20px 10px' }}>{h(slot)}</ElCard>
            }
        }} />
    )
})

export default _default