import CategoryEditable from "@app/components/common/Category/Editable"
import TooltipSiteList from "@app/components/Record/components/TooltipSiteList"
import { useCategory } from '@app/context'
import { t } from '@app/locale'
import { Flex } from '@pages/components'
import { CATE_NOT_SET_ID } from "@util/site"
import { getRelatedCateId, identifyStatKey, isCate, isGroup, isSite } from "@util/stat"
import { Effect, ElTableColumn, ElText, ElTooltip, type TagProps } from "element-plus"
import { defineComponent } from "vue"
import type { RowData } from '../../types'

const renderMerged = (cateId: number, categories: tt4b.site.Cate[], merged?: tt4b.stat.SiteRow[]) => {
    const notSet = CATE_NOT_SET_ID === cateId
    const name = notSet ? t(msg => msg.shared.cate.notSet) : categories.find(c => c.id === cateId)?.name
    const type: TagProps['type'] = notSet ? 'info' : 'primary'

    return !!name && (
        <ElTooltip
            effect={Effect.LIGHT}
            offset={10}
            placement="left"
            popperStyle={{ paddingInlineEnd: 0 }}
            v-slots={{
                content: () => <TooltipSiteList modelValue={merged} />,
                default: () => <ElText size="small" type={type}>{name}</ElText>,
            }}
        />
    )
}

type Props = {
    onChange: (key: tt4b.site.SiteKey, newCate: number | undefined) => void,
}

const CateColumn = defineComponent<Props>(props => {
    const cate = useCategory()
    return () => (
        <ElTableColumn label={t(msg => msg.siteManage.column.cate)} minWidth={140}>
            {({ row }: RowData) => {
                if (isGroup(row)) return
                const { mergedRows } = row
                const cateId = getRelatedCateId(row)
                return (
                    <Flex key={`${identifyStatKey(row)}_${cateId}`} justify="center">
                        {isCate(row) && renderMerged(row.cateKey, cate.all, mergedRows)}
                        {isSite(row) && (
                            <CategoryEditable
                                siteKey={row.siteKey}
                                modelValue={cateId}
                                onChange={newCateId => props.onChange(row.siteKey, newCateId)}
                            />
                        )}
                    </Flex>
                )
            }}
        </ElTableColumn>
    )
}, { props: ['onChange'] })

export default CateColumn