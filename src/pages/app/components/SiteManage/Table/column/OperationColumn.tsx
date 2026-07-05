/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { deleteSites } from '@api/sw/site'
import { useSiteManageTable } from '@app/components/SiteManage/context'
import { t } from '@app/locale'
import { Delete } from "@element-plus/icons-vue"
import { useManualRequest } from '@hooks'
import ConfirmButton from '@pages/components/ConfirmButton'
import { ElTableColumn, type RenderRowData } from "element-plus"
import { defineComponent } from "vue"

const OperationColumn = defineComponent<{}>(() => {
    const { refresh } = useSiteManageTable()
    const { refresh: doDelete } = useManualRequest<[tt4b.site.SiteKey], void>(deleteSites, { onSuccess: refresh })
    return () => (
        <ElTableColumn
            width={150}
            label={t(msg => msg.button.operation)}
            align="center"
            v-slots={
                ({ row }: RenderRowData<tt4b.site.SiteInfo>) => (
                    <ConfirmButton
                        buttonProps={{ icon: Delete, type: 'danger', size: 'small' }}
                        buttonText={t(msg => msg.button.delete)}
                        onConfirm={() => doDelete(row)}
                    />
                )}
        />
    )
})

export default OperationColumn