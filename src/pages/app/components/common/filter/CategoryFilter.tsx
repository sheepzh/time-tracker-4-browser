import { useCategory } from "@app/context"
import { t } from "@app/locale"
import { CATE_NOT_SET_ID } from "@util/site"
import { ElOption, ElSelect } from "element-plus"
import { computed, defineComponent, type StyleValue } from "vue"

type Props = ModelValue<number[] | undefined> & {
    disabled?: boolean
    useCache?: boolean
}

const CategoryFilter = defineComponent<Props>(props => {
    const cate = useCategory()

    const displayCategories = computed(() => [
        { id: CATE_NOT_SET_ID, name: t(msg => msg.shared.cate.notSet) } satisfies timer.site.Cate,
        ...cate.all,
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
        >
            {displayCategories.value?.map(cate => <ElOption value={cate.id} label={cate.name} />)}
        </ElSelect>
    ) : null
}, { props: ['modelValue', 'onChange', 'disabled', 'useCache'] })

export default CategoryFilter