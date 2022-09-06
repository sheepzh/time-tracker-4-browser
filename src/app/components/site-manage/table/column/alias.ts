/**
 * Copyright (c) 2021 Hengyang Zhang
 * 
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { ElIcon, ElTableColumn, ElTooltip } from "element-plus"
import { defineComponent, h } from "vue"
import { t } from "@app/locale"
import { InfoFilled } from "@element-plus/icons-vue"

const label = t(msg => msg.siteManage.column.alias)
const tooltip = t(msg => msg.siteManage.column.aliasInfo)

const _default = defineComponent({
    name: "AliasColumn",
    setup() {
        return () => h(ElTableColumn, {
            prop: 'host',
            minWidth: 100,
            align: 'center',
        }, {
            default: ({ row }: { row: timer.site.AliasIcon }) => h('span', row.name),
            header: () => {
                const infoTooltip = h(ElTooltip,
                    { content: tooltip, placement: 'top' },
                    () => h(ElIcon, { size: 11 }, () => h(InfoFilled))
                )
                return [label, ' ', infoTooltip]
            }
        })
    }
})

export default _default