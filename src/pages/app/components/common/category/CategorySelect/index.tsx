import { useCategory } from "@app/context"
import { t } from "@app/locale"
import { ArrowDown, CircleClose } from "@element-plus/icons-vue"
import { useManualRequest, useState } from '@hooks'
import cateService from "@service/cate-service"
import { selectAllSites } from '@service/site-service'
import { CATE_NOT_SET_ID } from '@util/site'
import { ElIcon, ElMessage, ElMessageBox, ElScrollbar, ElTooltip, useNamespace, type TooltipInstance } from "element-plus"
import { computed, defineComponent, ref } from "vue"
import CategoryDialog from '../CategoryDialog'
import OptionItem from "./OptionItem"
import SelectFooter from "./SelectFooter"

type Props = {
    modelValue: number | undefined
    size?: "small"
    width?: string
    clearable?: boolean
    onVisibleChange?: ArgCallback<boolean>
    onChange?: ArgCallback<number | undefined>
}

const useCategorySelect = (props: Props) => {
    const cate = useCategory()
    const [visible, setVisible] = useState(false)
    const [visibleLocked, setVisibleLocked] = useState(false)
    const tooltipRef = ref<TooltipInstance>()

    // Find selected category
    const selectedCategory = computed(() =>
        cate.all.find(c => c.id === props.modelValue)
    )

    // Handle visible change
    const handleVisibleChange = (newVisible: boolean) => {
        if (visibleLocked.value && !newVisible) {
            // Force keep open when locked
            return
        }
        setVisible(newVisible)
        props.onVisibleChange?.(newVisible)
    }

    // Select option
    const selectOption = (value: number) => {
        props.onChange?.(value)
        if (!visibleLocked.value) {
            setVisible(false)
        }
    }

    // Clear selection
    const handleClearClick = (e: Event) => {
        e.stopPropagation()
        props.onChange?.(undefined)
    }

    // Delete category
    const { refresh: removeCate } = useManualRequest(
        (id: number) => cateService.remove(id),
        {
            onSuccess: () => {
                cate.refresh()
                ElMessage.success(t(msg => msg.operation.successMsg))
            }
        }
    )

    const handleDeleteCategory = async (category: timer.site.Cate, e: MouseEvent) => {
        e.stopPropagation()

        // Check related sites
        const sites = await selectAllSites({ cateIds: category.id })
        const siteCount = sites?.length ?? 0
        if (siteCount) {
            ElMessage.warning(t(msg => msg.siteManage.cate.relatedMsg, { siteCount }))
            return
        }

        // Confirm and delete
        try {
            await ElMessageBox.confirm('', {
                message: t(msg => msg.siteManage.cate.removeConfirm, { category: category.name }),
                type: 'warning',
                closeOnClickModal: false,
            })
            await removeCate(category.id)
        } catch {
            // User cancelled
        }
    }

    // Edit category
    const handleEditCategory = async (category: timer.site.Cate, e: MouseEvent) => {
        e.stopPropagation()

        setVisibleLocked(true)
        setVisible(true)

        try {
            const edited = await CategoryDialog.open({ cate: category })
            await cateService.save(edited)
            cate.refresh()
        } catch {
            // User cancelled
        } finally {
            setVisibleLocked(false)
        }
    }

    return {
        cate,
        visible,
        tooltipRef,
        selectedCategory,
        handleVisibleChange,
        selectOption,
        handleClearClick,
        handleDeleteCategory,
        handleEditCategory,
    }
}

const CategorySelect = defineComponent<Props>((props, ctx) => {
    const {
        cate,
        visible,
        tooltipRef,
        selectedCategory,
        handleVisibleChange,
        selectOption,
        handleClearClick,
        handleDeleteCategory,
        handleEditCategory,
    } = useCategorySelect(props)

    const ns = useNamespace('select')

    const showClearIcon = computed(() =>
        props.clearable && props.modelValue !== undefined && props.modelValue !== CATE_NOT_SET_ID
    )

    return () => (
        <div class={[ns.b(), props.size && ns.m(props.size)]} style={{ width: props.width || '100%' }}>
            <ElTooltip
                ref={tooltipRef}
                visible={visible.value}
                placement="bottom-start"
                popperClass={ns.e('popper')}
                effect="light"
                pure
                trigger="click"
                transition={`${ns.namespace.value}-zoom-in-top`}
                persistent
                onUpdate:visible={handleVisibleChange}
                v-slots={{
                    default: () => (
                        <div class={[ns.e('wrapper'), ns.is('focused', visible.value)]}>
                            <div class={ns.e('selection')}>
                                <div class={ns.e('selected-item')}>
                                    <div class={ns.e('placeholder')}>
                                        <span>{selectedCategory.value?.name || 'Select category'}</span>
                                    </div>
                                </div>
                            </div>
                            <div class={ns.e('suffix')}>
                                {showClearIcon.value && (
                                    <span onClick={handleClearClick}>
                                        <ElIcon class={[ns.e('caret'), ns.e('icon'), ns.e('clear')]}>
                                            <CircleClose />
                                        </ElIcon>
                                    </span>
                                )}
                                <ElIcon class={[ns.e('caret'), ns.e('icon'), ns.is('reverse', visible.value)]}>
                                    <ArrowDown />
                                </ElIcon>
                            </div>
                        </div>
                    ),
                    content: () => (
                        <div class={ns.b('dropdown')}>
                            <ElScrollbar
                                tag="ul"
                                wrapClass={ns.be('dropdown', 'wrap')}
                                viewClass={ns.be('dropdown', 'list')}
                            >
                                {cate.all.map(c => (
                                    <div
                                        key={c.id}
                                        class={[
                                            ns.be('dropdown', 'item'),
                                            ns.is('selected', props.modelValue === c.id)
                                        ]}
                                        onClick={() => selectOption(c.id)}
                                    >
                                        <OptionItem
                                            value={c}
                                            onEdit={e => handleEditCategory(c, e)}
                                            onDelete={e => handleDeleteCategory(c, e)}
                                        />
                                    </div>
                                ))}
                            </ElScrollbar>
                            <div class={ns.be('dropdown', 'footer')}>
                                <SelectFooter />
                            </div>
                        </div>
                    )
                }}
            />
        </div>
    )
}, { props: ['clearable', 'modelValue', 'size', 'width', 'onVisibleChange', 'onChange'] })

export default CategorySelect