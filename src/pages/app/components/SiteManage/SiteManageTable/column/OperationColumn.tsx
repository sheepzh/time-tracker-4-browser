/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import PopupConfirmButton from '@app/components/common/PopupConfirmButton'
import { useRequest } from '@hooks'
import { t } from '@app/locale'
import { Delete } from "@element-plus/icons-vue"
import { removeSites } from "@api/sw/site"
import { ElTableColumn, type RenderRowData } from "element-plus"
import { defineComponent } from "vue"
import { useSiteManageTable } from '../../useSiteManage'

const OperationColumn = defineComponent<{}>(() => {
    const { refresh } = useSiteManageTable()
    const { refresh: handleConfirm } = useRequest<[timer.site.SiteKey], void>((key: timer.site.SiteKey) => removeSites(key), { onSuccess: () => refresh() })
    return () => (
        <ElTableColumn
            width={150}
            label={t(msg => msg.button.operation)}
            align="center"
            v-slots={
                ({ row }: RenderRowData<timer.site.SiteInfo>) => (
                    <PopupConfirmButton
                        buttonIcon={Delete}
                        buttonType="danger"
                        buttonText={t(msg => msg.button.delete)}
                        confirmText={t(msg => msg.siteManage.deleteConfirmMsg, { host: row.host })}
                        onConfirm={() => handleConfirm(row)}
                    />
                )}
        />
    )
})

export default OperationColumn