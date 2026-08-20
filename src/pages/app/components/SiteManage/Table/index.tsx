/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { deleteSites, fillInitialAlias, getSitePage, modifySite } from '@api/sw/site'
import Category from '@app/components/common/Category'
import ColumnHeader from '@app/components/common/ColumnHeader'
import ContentCard from '@app/components/common/ContentCard'
import HostAlert from '@app/components/common/HostAlert'
import Pagination from '@app/components/common/Pagination'
import { t } from '@app/locale'
import { Delete } from '@element-plus/icons-vue'
import { useOperation, useRequest } from '@hooks'
import ConfirmButton from '@pages/components/ConfirmButton'
import EditableImg from '@pages/components/EditableImg'
import Flex from '@pages/components/Flex'
import { ElTable, ElTableColumn, ElTag, TagProps, type RenderRowData } from "element-plus"
import { defineComponent, reactive, ref } from "vue"
import { ALL_TYPES } from '../common'
import { useSiteManage } from '../context'
import { DisplayComponent } from '../types'
import AliasColumn from "./column/AliasColumn"
import OptionsColumn from './column/OptionsColumn'
import { RenderParam } from './types'

const TYPE_TAG: Record<tt4b.site.Type, TagProps['type']> = {
    normal: undefined,
    merged: 'info',
    virtual: 'success'
}

const _default = defineComponent<{}>((_, ctx) => {
    const selected = ref<tt4b.site.SiteInfo[]>([])
    const { filter } = useSiteManage()
    const loadingTarget = ref<HTMLElement>()
    const page = reactive<tt4b.common.PageQuery>({ num: 1, size: 20 })
    const { data: pagination, refresh, loading } = useRequest(() => {
        const { query: fuzzyQuery, cateIds, types, host } = filter
        return getSitePage({ fuzzyQuery, cateIds, types, host }, page)
    }, {
        defaultValue: { list: [], total: 0 },
        loadingTarget,
        deps: [() => filter, () => page],
    })

    const changeIcon = useOperation(({ type, host, alias }: tt4b.site.SiteInfo, iconUrl: string | undefined) => {
        return modifySite({ type, host, alias, iconUrl })
    }, { onSuccess: refresh })

    const getSelected = () => selected.value ?? []
    ctx.expose({ refresh, getSelected } satisfies DisplayComponent)

    const doDelete = useOperation(deleteSites, { onSuccess: refresh })
    const doFillAlias = useOperation(() => fillInitialAlias(pagination.value.list), { onSuccess: refresh })

    return () => (
        <ContentCard>
            <Flex column width='100%' height='100%' gap={23}>
                <Flex flex={1} height={0}>
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
                            v-slots={({ row }: RenderParam) => <HostAlert value={row} />}
                        />
                        <ElTableColumn
                            minWidth={130}
                            align="center"
                            v-slots={{
                                header: () => (
                                    <ColumnHeader
                                        label={t(msg => msg.siteManage.column.type)}
                                        v-slots={{
                                            tooltip: () => ALL_TYPES.flatMap((type, idx) => {
                                                const text = `${t(msg => msg.shared.site.type[type])} - ${t(msg => msg.siteManage.typeInfo[type])}`
                                                return idx === 0 ? [text] : [<br />, text]
                                            }),
                                        }}
                                    />
                                ),
                                default: ({ row: { type } }: RenderRowData<tt4b.site.SiteInfo>) => (
                                    <ElTag size="small" type={TYPE_TAG[type]}>
                                        {t(msg => msg.shared.site.type[type])}
                                    </ElTag>
                                )
                            }}
                        />
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
                        <AliasColumn onChanged={refresh} onFillAlias={doFillAlias} />
                        <ElTableColumn
                            label={t(msg => msg.siteManage.column.cate)}
                            minWidth={140}
                            align="center"
                            v-slots={({ row }: RenderParam) => (
                                <Category.Editable siteKey={row} modelValue={row?.cate} onChange={val => row.cate = val} />
                            )}
                        />
                        <OptionsColumn onChanged={refresh} />
                        <ElTableColumn
                            width={120}
                            label={t(msg => msg.button.operation)}
                            align="center"
                            v-slots={({ row }: RenderParam) => (
                                <ConfirmButton
                                    buttonProps={{ icon: Delete, type: 'danger', size: 'small', link: true }}
                                    buttonText={t(msg => msg.button.delete)}
                                    onConfirm={() => doDelete(row)}
                                />
                            )}
                        />
                    </ElTable>
                </Flex>
                <Flex justify='center'>
                    <Pagination
                        disabled={loading.value}
                        defaultValue={page}
                        total={pagination.value.total}
                        onChange={val => { page.num = val.num, page.size = val.size }}
                    />
                </Flex>
            </Flex>
        </ContentCard>
    )
})

export default _default
