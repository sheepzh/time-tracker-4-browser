/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import HostAlert from '@app/components/common/HostAlert'
import TooltipSiteList from '@app/components/Record/components/TooltipSiteList'
import { useRecordFilter } from '@app/components/Record/context'
import type { RecordSort } from '@app/components/Record/types'
import { t } from '@app/locale'
import Flex from "@pages/components/Flex"
import TooltipWrapper from '@pages/components/TooltipWrapper'
import { identifySiteKey } from "@util/site"
import { isGroup, isSite } from "@util/stat"
import { Effect, ElTableColumn, type RenderRowData } from "element-plus"
import { defineComponent } from "vue"

const _default = defineComponent(() => {
    const filter = useRecordFilter()
    return () => (
        <ElTableColumn
            prop={'host' satisfies RecordSort['prop']}
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
                            content: () => (
                                <TooltipSiteList
                                    modelValue={isGroup(row) ? undefined : (row.mergedRows as timer.stat.SiteRow[] | undefined)}
                                />
                            ),
                            default: () => isSite(row) ? <HostAlert value={row.siteKey} iconUrl={row.iconUrl} /> : '',
                        }}
                    />
                </Flex>
            )}
        </ElTableColumn>
    )
})

export default _default