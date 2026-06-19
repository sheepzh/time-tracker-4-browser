/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { changeSiteRun, modifySite } from '@api/sw/site'
import Category from '@app/components/common/Category'
import HostAlert from '@app/components/common/HostAlert'
import { t } from '@app/locale'
import { useManualRequest } from '@hooks'
import EditableImg from '@pages/components/EditableImg'
import Flex from '@pages/components/Flex'
import { ElSwitch, ElTable, ElTableColumn, type RenderRowData } from "element-plus"
import { defineComponent } from "vue"
import { useSiteManageTable } from '../context'
import AliasColumn from "./column/AliasColumn"
import OperationColumn from "./column/OperationColumn"
import TypeColumn from "./column/TypeColumn"

type RenderParam = RenderRowData<tt4b.site.SiteInfo>

const _default = defineComponent<{}>(() => {
    const { selected, refresh, pagination } = useSiteManageTable()

    const { refresh: changeIcon } = useManualRequest((row: tt4b.site.SiteInfo, iconUrl: string | undefined) => {
        const { type, host, alias } = row
        return modifySite({ type, host, alias, iconUrl })
    }, { onSuccess: refresh })

    const { refresh: changeRun } = useManualRequest(changeSiteRun, { onSuccess: refresh })

    return () => (
        <ElTable
            data={pagination.value.list}
            height="100%"
            highlightCurrentRow border fit
            onSelection-change={val => selected.value = val}
        >
            <ElTableColumn type="selection" align="center" />
            <ElTableColumn
                label={t(msg => msg.item.host)}
                minWidth={220}
                align="center"
                v-slots={({ row }: RenderParam) => (
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
                v-slots={({ row }: RenderParam) => row.type === 'normal' && (
                    <Flex justify="center">
                        <EditableImg
                            size={12}
                            src={row.iconUrl ?? ''}
                            onError={() => changeIcon(row, undefined)}
                            onSave={url => changeIcon(row, url)}
                        />
                    </Flex>
                )}
            />
            <AliasColumn />
            <ElTableColumn
                label={t(msg => msg.siteManage.column.cate)}
                minWidth={140}
                align="center"
                v-slots={({ row }: RenderParam) => (
                    <Category.Editable siteKey={row} modelValue={row?.cate} onChange={val => row.cate = val} />
                )}
            />
            <ElTableColumn
                label={t(msg => msg.item.run)}
                width={100}
                align="center"
            >
                {({ row }: RenderParam) => row.type === 'normal' && (
                    <ElSwitch
                        size="small"
                        modelValue={row.run}
                        onChange={val => changeRun(row, !!val)}
                    />
                )}
            </ElTableColumn>
            <OperationColumn />
        </ElTable>
    )
})

export default _default
