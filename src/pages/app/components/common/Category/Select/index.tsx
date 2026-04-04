import { useCategory } from "@app/context"
import { CATE_NOT_SET_ID } from '@util/site'
import { ElOption, ElSelect, type SelectInstance } from "element-plus"
import { defineComponent, ref } from "vue"
import OptionItem from "./OptionItem"
import SelectFooter from "./SelectFooter"

export type Instance = {
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

const Select = defineComponent<Props>((props, ctx) => {
    const cate = useCategory()

    const selectRef = ref<SelectInstance>()
    ctx.expose({
        openOptions: () => selectRef.value?.selectOption?.()
    } satisfies Instance)

    return () => (
        <ElSelect
            ref={selectRef}
            size={props.size}
            modelValue={props.modelValue}
            onChange={val => props.onChange?.(val)}
            onVisible-change={visible => props.onVisibleChange?.(visible)}
            style={{ width: props.width || '100%' }}
            clearable={props.clearable}
            onClear={() => props.onChange?.(undefined)}
            emptyValues={[CATE_NOT_SET_ID, undefined]}
            v-slots={{ footer: () => <SelectFooter /> }}
        >
            {cate.all.map(c => (
                <ElOption value={c.id} label={c.name}>
                    <OptionItem value={c} />
                </ElOption>
            ))}
        </ElSelect>
    )
}, { props: ['clearable', 'modelValue', 'size', 'width', 'onVisibleChange', 'onChange'] })

export default Select
