import { changeSitesCate, deleteSites } from '@api/sw/site'
import { t } from '@app/locale'
import { WarnTriangleFilled } from '@element-plus/icons-vue'
import { useSwitch } from '@hooks'
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

    const onCateChangeConfirm = async () => {
        const cateId = targetCate.value
        if (!cateId) return ElMessage.warning("Category not selected")

        await changeSitesCate(cateId, ...supported.value)
        ElMessage.success(t(msg => msg.operation.successMsg))
        closeSelect()
        refresh()
    }

    const batchDisassociate = () => {
        if (!selected.value.length) {
            return ElMessage.info("No site selected")
        }
        ElMessageBox.confirm(
            t(msg => msg.siteManage.msg.disassociatedMsg),
            {
                type: 'warning',
                title: t(msg => msg.siteManage.cate.batchDisassociate),
                closeOnClickModal: true,
            }
        ).then(async () => {
            const need2Clear = supported.value.filter(s => s.cate)
            need2Clear.length && await changeSitesCate(undefined, ...need2Clear)
            ElMessage.success(t(msg => msg.operation.successMsg))
            refresh()
        }).catch(() => { })
    }
    const batchDelete = () => {
        if (!selected.value.length) {
            return ElMessage.info("No site selected")
        }
        ElMessageBox.confirm(
            t(msg => msg.siteManage.msg.batchDeleteMsg),
            {
                type: 'error',
                title: t(msg => msg.button.batchDelete),
                closeOnClickModal: true,
                icon: markRaw(WarnTriangleFilled),
            }
        ).then(async () => {
            await deleteSites(...(selected.value ?? []))
            ElMessage.success(t(msg => msg.operation.successMsg))
            refresh()
        }).catch(() => { })
    }

    return {
        batchChange, batchDisassociate, batchDelete,
        selectVisible, closeSelect,
        targetCate, onCateChangeConfirm,
    }
}
