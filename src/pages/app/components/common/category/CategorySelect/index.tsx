import { useCategory } from "@app/context"
import { CATE_NOT_SET_ID } from '@util/site'
import { ElOption, ElSelect, type SelectInstance } from "element-plus"
import { computed, defineComponent, ref } from "vue"
import OptionItem from "./OptionItem"
import SelectFooter from "./SelectFooter"

export type CategorySelectInstance = {
    openOptions: () => void
}

type Props = {
    modelValue: number | undefined
    size?: "small"
    width?: string
    clearable?: boolean
    onVisibleChange?: ArgCallback<boolean>
    onChange?: ArgCallback<number | undefined>
}

const CategorySelect = defineComponent<Props>((props, ctx) => {
    const cate = useCategory()
    const options = computed(() => cate.all.map(c => ({ value: c.id, label: <OptionItem value={c} /> })))

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
            emptyValues={[CATE_NOT_SET_ID, undefined]}
            v-slots={{ footer: () => <SelectFooter /> }}
        >
            {cate.all.map(c => (
                <ElOption value={c?.id} label={c?.name}>
                    <OptionItem value={c} />
                </ElOption>
            ))}
        </ElSelect>
    )
}, { props: ['clearable', 'modelValue', 'size', 'width', 'onVisibleChange', 'onChange'] })

export default CategorySelect