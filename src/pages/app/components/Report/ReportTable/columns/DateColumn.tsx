/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { t } from "@app/locale"
import { cvt2LocaleTime } from "@app/util/time"
import { ElTableColumn, RenderRowData } from "element-plus"
import { type FunctionalComponent } from "vue"
import type { ReportSort } from "../../types"

const DateColumn: FunctionalComponent = () => (
    <ElTableColumn
        prop={'date' satisfies ReportSort['prop']}
        label={t(msg => msg.item.date)}
        minWidth={135}
        align="center"
        sortable="custom"
    >
        {({ row }: RenderRowData<timer.stat.Row>) => <span>{cvt2LocaleTime(row.date)}</span>}
    </ElTableColumn>
)

export default DateColumn