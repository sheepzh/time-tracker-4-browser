/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { t } from "@app/locale"
import { Check, Close, WarnTriangleFilled } from "@element-plus/icons-vue"
import { useState, useSwitch } from "@hooks"
import Flex from "@pages/components/Flex"
import siteService from "@service/site-service"
import { supportCategory } from "@util/site"
import { ElButton, ElDialog, ElForm, ElFormItem, ElMessage, ElMessageBox } from "element-plus"
import { computed, defineComponent, markRaw, ref, type VNode } from "vue"
import ContentContainer from "../common/ContentContainer"
import Pagination from "../common/Pagination"
import CategorySelect from "../common/category/CategorySelect"
import SiteManageFilter from "./SiteManageFilter"
import Modify, { type ModifyInstance } from './SiteManageModify'
import SiteManageTable from "./SiteManageTable"
import { initSiteManage } from './useSiteManage'

export default defineComponent(() => {
    const loadingTarget = ref<VNode>()
    const {
        page, pagination, refresh, loading,
        selected
    } = initSiteManage(() => loadingTarget.value?.el as HTMLElement | undefined)
    const modify = ref<ModifyInstance>()

    const cateSupported = computed(() => selected?.value?.filter(supportCategory) || [])
    const [showCateChange, openCateChange, closeCateChange] = useSwitch(false)
    const [batchCate, setBatchCate] = useState<number>()

    const handleChangeCate = () => {
        if (!selected.value?.length) {
            return ElMessage.info(t(msg => msg.siteManage.msg.noSelected))
        }
        if (!cateSupported.value?.length) {
            return ElMessage.info(t(msg => msg.siteManage.msg.noSupported))
        }
        setBatchCate()
        openCateChange()
    }

    const onCateChangeConfirm = async () => {
        const cateId = batchCate.value
        if (!cateId) {
            return ElMessage.warning("Category not selected")
        }
        await siteService.batchSaveCate(cateId, cateSupported.value)
        ElMessage.success(t(msg => msg.operation.successMsg))
        closeCateChange()
        refresh()
    }

    const handleDisassociate = () => {
        if (!selected.value?.length) {
            return ElMessage.info(t(msg => msg.siteManage.msg.noSelected))
        }
        ElMessageBox.confirm(
            t(msg => msg.siteManage.msg.disassociatedMsg),
            {
                type: 'warning',
                title: t(msg => msg.siteManage.cate.batchDisassociate),
                closeOnClickModal: true,
            }
        ).then(async () => {
            const need2Clear = cateSupported.value?.filter(s => s.cate)
            need2Clear?.length && await siteService.batchSaveCate(undefined, need2Clear)
            ElMessage.success(t(msg => msg.operation.successMsg))
            refresh()
        }).catch(() => { })
    }

    const handleBatchDelete = () => {
        if (!selected.value?.length) {
            return ElMessage.info(t(msg => msg.siteManage.msg.noSelected))
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
            await siteService.remove(...(selected.value ?? []))
            ElMessage.success(t(msg => msg.operation.successMsg))
            refresh()
        }).catch(() => { })
    }

    return () => <ContentContainer v-slots={{
        filter: () => (
            <SiteManageFilter
                onCreate={() => modify.value?.add?.()}
                onBatchChangeCate={handleChangeCate}
                onBatchDelete={handleBatchDelete}
                onBatchDisassociate={handleDisassociate}
            />
        ),
        content: () => <>
            <Flex ref={loadingTarget} column width="100%" height="100%" gap={23}>
                <Flex flex={1} height={0}>
                    <SiteManageTable />
                </Flex>
                <Flex justify="center">
                    <Pagination
                        disabled={loading.value}
                        defaultValue={page}
                        total={pagination.value?.total || 0}
                        onChange={val => { page.num = val.num, page.size = val.size }}
                    />
                </Flex>
            </Flex>
            <Modify ref={modify} onSave={refresh} />
            <ElDialog
                title={t(msg => msg.siteManage.cate.batchChange)}
                width={300}
                modelValue={showCateChange.value}
                onClose={closeCateChange}
                v-slots={{
                    default: () => <>
                        <ElForm>
                            <ElFormItem label={t(msg => msg.siteManage.cate.name)} required>
                                <CategorySelect modelValue={batchCate.value} onChange={setBatchCate} />
                            </ElFormItem>
                        </ElForm>
                    </>,
                    footer: () => <>
                        <Flex justify="end">
                            <ElButton icon={Close} type="info" onClick={closeCateChange}>
                                {t(msg => msg.button.cancel)}
                            </ElButton>
                            <ElButton icon={Check} type="primary" onClick={onCateChangeConfirm}>
                                {t(msg => msg.button.confirm)}
                            </ElButton>
                        </Flex>
                    </>
                }}
            />
        </>,
    }} />
})
