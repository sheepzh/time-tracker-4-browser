/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import HostAlert from "@app/components/common/HostAlert"
import { t } from "@app/locale"
import Flex from "@pages/components/Flex"
import { type ElTableRowScope } from "@pages/element-ui/table"
import siteService from "@service/site-service"
import { SiteMap } from "@util/site"
import { ElMessage, ElSwitch, ElTable, ElTableColumn } from "element-plus"
import { defineComponent } from "vue"
import Category from "../../common/category/CategoryEditable"
import { useSiteManageTable } from '../useSiteManage'
import AliasColumn, { genInitialAlias } from "./column/AliasColumn"
import OperationColumn from "./column/OperationColumn"
import TypeColumn from "./column/TypeColumn"

const _default = defineComponent<{}>(() => {
    const { setSelected, refresh, pagination } = useSiteManageTable()

    const handleIconError = async (row: timer.site.SiteInfo) => {
        await siteService.removeIconUrl(row)
        row.iconUrl = undefined
    }

    const handleRunChange = async (val: boolean, row: timer.site.SiteInfo) => {
        // Save
        await siteService.saveRun(row, val)
        row.run = val
        refresh()
    }

    const handleBatchGenerate = async () => {
        let data = pagination.value?.list
        if (!data?.length) {
            return ElMessage.info("No data")
        }
        const toSave = new SiteMap<string>()
        const items = await siteService.batchSelect(data)
        items.filter(i => !i.alias).forEach(site => {
            const newAlias = genInitialAlias(site)
            newAlias && toSave.put(site, newAlias)
        })
        await siteService.batchSaveAliasNoRewrite(toSave)
        refresh()
        ElMessage.success(t(msg => msg.operation.successMsg))
    }

    return () => (
        <ElTable
            data={pagination.value?.list}
            height="100%"
            highlightCurrentRow border fit
            onSelection-change={setSelected}
        >
            <ElTableColumn type="selection" align="center" />
            <ElTableColumn
                label={t(msg => msg.item.host)}
                minWidth={220}
                align="center"
                v-slots={({ row }: ElTableRowScope<timer.site.SiteInfo>) => (
                    <div style={{ margin: 'auto', width: 'fit-content' }}>
                        <HostAlert value={row} />
                    </div>
                )}
            />
            <TypeColumn />
            <ElTableColumn
                label={t(msg => msg.siteManage.column.icon)}
                minWidth={100}
                align="center"
                v-slots={({ row }: ElTableRowScope<timer.site.SiteInfo>) => {
                    const { iconUrl } = row || {}
                    if (!iconUrl) return ''
                    return (
                        <Flex align="center" justify="center">
                            <img width={12} height={12} src={iconUrl} onError={() => handleIconError(row)} />
                        </Flex>
                    )
                }}
            />
            <AliasColumn />
            <ElTableColumn
                label={t(msg => msg.siteManage.column.cate)}
                minWidth={140}
                align="center"
                v-slots={({ row }: ElTableRowScope<timer.site.SiteInfo>) => (
                    <Category
                        siteKey={row}
                        cateId={row?.cate}
                        onChange={cateId => row.cate = cateId}
                    />
                )}
            />
            <ElTableColumn
                label={t(msg => msg.item.run)}
                width={100}
                align="center"
            >
                {({ row }: ElTableRowScope<timer.site.SiteInfo>) => row.type === 'normal' && (
                    <ElSwitch
                        size="small"
                        modelValue={row.run}
                        onChange={val => handleRunChange(!!val, row)}
                    />
                )}
            </ElTableColumn>
            <OperationColumn />
        </ElTable>
    )
})

export default _default
