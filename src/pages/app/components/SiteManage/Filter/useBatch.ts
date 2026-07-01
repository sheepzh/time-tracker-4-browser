import { changeSitesCate, deleteSites } from '@api/sw/site'
import { t } from '@app/locale'
import { WarnTriangleFilled } from '@element-plus/icons-vue'
import { useOperation, useSwitch } from '@hooks'
import { supportCategory } from '@util/site'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, markRaw, ref } from 'vue'
import { useSiteManageTable } from '../context'

export const useBatch = () => {
    const { refresh, selected } = useSiteManageTable()

    const supported = computed(() => selected.value.filter(supportCategory))
    const [selectVisible, openSelect, closeSelect] = useSwitch(false)
    const targetCate = ref<number>()

    const batchChange = () => {
        if (!selected.value.length) {
            return ElMessage.info("No site selected")
        }
        if (!supported.value.length) {
            return ElMessage.info("Selected sites don't support category")
        }
        targetCate.value = undefined
        openSelect()
    }

    const onCateChangeConfirm = useOperation(async () => {
        const cateId = targetCate.value
        if (!cateId) throw "Category not selected"

        await changeSitesCate(cateId, ...supported.value)
    }, {
        onSuccess: () => {
            closeSelect()
            refresh()
        }
    })

    const batchDisassociate = useOperation(async () => {
        if (!selected.value.length) throw "No site selected"
        await ElMessageBox.confirm(
            t(msg => msg.siteManage.msg.disassociatedMsg),
            {
                type: 'warning',
                title: t(msg => msg.siteManage.cate.batchDisassociate),
                closeOnClickModal: true,
            }
        )
        const need2Clear = supported.value.filter(s => s.cate)
        need2Clear.length && await changeSitesCate(undefined, ...need2Clear)
    }, { onSuccess: refresh })

    const batchDelete = useOperation(async () => {
        const list = selected.value
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
