/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import PopupConfirmButton from "@app/components/common/PopupConfirmButton"
import { t } from "@app/locale"
import { Delete } from "@element-plus/icons-vue"
import { type ElTableRowScope } from "@pages/element-ui/table"
import siteService from "@service/site-service"
import { ElTableColumn } from "element-plus"
import type { FunctionalComponent } from "vue"

type Props = { onDelete?: ArgCallback<timer.site.SiteInfo> }

const _default: FunctionalComponent<Props> = props => (
    <ElTableColumn
        width={150}
        label={t(msg => msg.button.operation)}
        align="center"
        v-slots={
            ({ row }: ElTableRowScope<timer.site.SiteInfo>) => (
                <PopupConfirmButton
                    buttonIcon={Delete}
                    buttonType="danger"
                    buttonText={t(msg => msg.button.delete)}
                    confirmText={t(msg => msg.siteManage.deleteConfirmMsg, { host: row.host })}
                    onConfirm={async () => {
                        await siteService.remove(row)
                        props.onDelete?.(row)
                    }}
                />
            )}
    />
)

export default _default