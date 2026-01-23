import { useCategory } from "@app/context"
import { t } from "@app/locale"
import { CATE_NOT_SET_ID } from "@util/site"
import { ElSelect } from "element-plus"
import { computed, defineComponent, type StyleValue } from "vue"

type Props = ModelValue<number[] | undefined> & {
    disabled?: boolean
    useCache?: boolean
}

const CategoryFilter = defineComponent<Props>(props => {
    const cate = useCategory()

    const options = computed(() => [
        ...cate.all.map(c => ({ value: c.id, label: c.name })),
        { value: CATE_NOT_SET_ID, label: t(msg => msg.shared.cate.notSet) },
    ])

    return () => cate.enabled ? (
        <ElSelect
            modelValue={props.modelValue}
            onChange={(val: number[]) => props.onChange?.(val)}
            multiple
            clearable
            filterable
            collapseTags
            disabled={props.disabled}
            onClear={() => props.onChange?.(undefined)}
            placeholder={t(msg => msg.siteManage.column.cate)}
            style={{ width: '200px' } satisfies StyleValue}
            options={options.value}
        />
    ) : null
}, { props: ['modelValue', 'onChange', 'disabled', 'useCache'] })

export default CategoryFilter