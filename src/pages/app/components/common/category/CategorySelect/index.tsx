import { useCategories } from "@app/context"
import { ElOption, ElSelect, type SelectInstance } from "element-plus"
import { defineComponent, type PropType, ref } from "vue"
import OptionItem from "./OptionItem"
import SelectFooter from "./SelectFooter"

export type CategorySelectInstance = {
    openOptions: () => void
}

const CategorySelect = defineComponent({
    props: {
        modelValue: Number,
        size: String as PropType<"small" | "">,
        width: String,
        clearable: Boolean,
    },
    emits: {
        visibleChange: (_visible: boolean) => true,
        change: (_newVal: number | undefined) => true,
    },
    setup(props, ctx) {
        const { categories } = useCategories()

        const selectRef = ref<SelectInstance>()
        ctx.expose({
            openOptions: () => selectRef.value?.selectOption?.()
        } satisfies CategorySelectInstance)

        return () => (
            <ElSelect
                ref={selectRef}
                size={props.size}
                modelValue={props.modelValue}
                onChange={val => ctx.emit('change', val)}
                onVisible-change={visible => ctx.emit('visibleChange', visible)}
                style={{ width: props.width || '100%' }}
                clearable={props.clearable}
                onClear={() => ctx.emit('change', undefined)}
                v-slots={{ footer: () => <SelectFooter /> }}
            >
                {categories.value?.map(c => (
                    <ElOption value={c?.id} label={c?.name}>
                        <OptionItem value={c} />
                    </ElOption>
                ))}
            </ElSelect>
        )
    }
})

export default CategorySelect