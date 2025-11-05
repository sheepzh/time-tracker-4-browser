/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import HostAlert from "@app/components/common/HostAlert"
import TooltipWrapper from "@app/components/common/TooltipWrapper"
import { t } from "@app/locale"
import Flex from "@pages/components/Flex"
import { identifySiteKey } from "@util/site"
import { isGroup, isSite } from "@util/stat"
import { Effect, ElTableColumn, type RenderRowData } from "element-plus"
import { defineComponent } from "vue"
import { useReportFilter } from "../../context"
import type { ReportSort } from "../../types"
import TooltipSiteList from "./TooltipSiteList"

const _default = defineComponent(() => {
    const filter = useReportFilter()
    return () => (
        <ElTableColumn
            prop={'host' satisfies ReportSort['prop']}
            label={t(msg => msg.item.host)}
            minWidth={210}
            sortable="custom"
            align="center"
        >
            {({ row }: RenderRowData<timer.stat.Row>) => (
                <Flex key={isSite(row) ? identifySiteKey(row.siteKey) : ''} justify="center">
                    <TooltipWrapper
                        usePopover={filter?.siteMerge === 'domain'}
                        effect={Effect.LIGHT}
                        offset={10}
                        placement="left"
                        v-slots={{
                            content: () => <TooltipSiteList modelValue={isGroup(row) ? undefined : row.mergedRows} />,
                            default: () => isSite(row) ? <HostAlert value={row.siteKey} iconUrl={row.iconUrl} /> : '',
                        }}
                    />
                </Flex>
            )}
        </ElTableColumn >
    )
})

export default _default