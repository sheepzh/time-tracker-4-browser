import { useCategory } from "@app/context"
import { Edit } from "@element-plus/icons-vue"
import { useManualRequest, useSwitch } from "@hooks"
import Flex from "@pages/components/Flex"
import { saveSiteCate } from '@service/site-service'
import { supportCategory } from "@util/site"
import { ElIcon, ElTag } from "element-plus"
import { computed, defineComponent, nextTick, ref } from "vue"
import CategorySelect, { CategorySelectInstance } from "./CategorySelect"

type Props = ModelValue<number | undefined> & {
    siteKey: timer.site.SiteKey
}

const CategoryEditable = defineComponent<Props>(props => {
    const cate = useCategory()
    const [editing, openEditing, closeEditing] = useSwitch()

    const current = computed(() => {
        const id = props.modelValue
        const categories = cate.all
        if (!id || !categories.length) return undefined
        return categories.find(c => c.id == id)
    })

    const { refresh: doSave } = useManualRequest(async (cateId: number | string | undefined) => {
        const realCateId = typeof cateId === 'string' ? parseInt(cateId) : cateId
        await saveSiteCate(props.siteKey, realCateId)
        return realCateId
    }, {
        onSuccess(realCateId) {
            closeEditing()
            props.onChange?.(realCateId)
        },
    })

    const handleEditClick = () => {
        openEditing()
        nextTick(() => selectRef.value?.openOptions?.())
    }

    const selectRef = ref<CategorySelectInstance>()

    return () => supportCategory(props.siteKey) ?
        <Flex width="100%" height="100%" justify="center">
            {editing.value ?
                <CategorySelect
                    ref={selectRef}
                    size="small"
                    width="100px"
                    modelValue={props.modelValue}
                    onChange={doSave}
                    onVisibleChange={visible => !visible && closeEditing()}
                />
                :
                <Flex align="center" gap={5} height="100%">
                    {current.value &&
                        <ElTag
                            size="small"
                            closable
                            onClose={() => doSave(undefined)}
                        >
                            {current.value.name}
                        </ElTag>
                    }
                    <Flex align="center" onClick={handleEditClick}>
                        <ElIcon style={{ cursor: 'pointer' }}>
                            <Edit />
                        </ElIcon>
                    </Flex>
                </Flex >
            }
        </Flex>
        : false
}, { props: ['modelValue', 'onChange', 'siteKey'] })

export default CategoryEditable