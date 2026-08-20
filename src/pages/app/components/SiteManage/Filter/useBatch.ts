import { changeSitesCate, deleteSites } from '@api/sw/site'
import { t } from '@app/locale'
import { WarnTriangleFilled } from '@element-plus/icons-vue'
import { useOperation, useSwitch } from '@hooks'
import { supportCategory } from '@util/site'
import { ElMessage, ElMessageBox } from 'element-plus'
import { markRaw, ref } from 'vue'
import { useSiteManage } from '../context'

export const useBatch = () => {
    const { comp } = useSiteManage()
    const getSelected = () => comp.value?.getSelected() ?? []
    const refresh = () => comp.value?.refresh()
    const [selectVisible, openSelect, closeSelect] = useSwitch(false)
    const targetCate = ref<number>()

    const batchChange = () => {
        const selected = getSelected()
        if (!selected.length) {
            return ElMessage.info("No site selected")
        }
        const supported = selected.filter(supportCategory)
        if (!supported.length) {
            return ElMessage.info("Selected sites don't support category")
        }
        targetCate.value = undefined
        openSelect()
    }

    const onCateChangeConfirm = useOperation(async () => {
        const cateId = targetCate.value
        if (!cateId) throw "Category not selected"
        const supported = getSelected().filter(supportCategory)
        await changeSitesCate(cateId, ...supported)
    }, {
        onSuccess: () => {
            closeSelect()
            refresh()
        }
    })

    const batchDisassociate = useOperation(async () => {
        const selected = getSelected()
        if (!selected.length) throw "No site selected"
        await ElMessageBox.confirm(
            t(msg => msg.siteManage.msg.disassociatedMsg),
            {
                type: 'warning',
                title: t(msg => msg.siteManage.cate.batchDisassociate),
                closeOnClickModal: true,
            }
        )
        const supported = selected.filter(supportCategory)
        const need2Clear = supported.filter(s => s.cate)
        need2Clear.length && await changeSitesCate(undefined, ...need2Clear)
    }, { onSuccess: refresh })

    const batchDelete = useOperation(async () => {
        const list = getSelected()
        if (!list.length) throw "No site selected"
        await ElMessageBox.confirm(
            t(msg => msg.siteManage.msg.batchDeleteMsg),
            {
                type: 'error',
                title: t(msg => msg.button.batchDelete),
                closeOnClickModal: true,
                icon: markRaw(WarnTriangleFilled),
            }
        )
        await deleteSites(...list)
    }, { onSuccess: refresh })

    return {
        batchChange, batchDisassociate, batchDelete,
        selectVisible, closeSelect,
        targetCate, onCateChangeConfirm,
    }
}
