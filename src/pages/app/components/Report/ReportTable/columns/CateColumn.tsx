import CategoryEditable from "@app/components/common/category/CategoryEditable"
import { useCategory } from "@app/context"
import { t } from "@app/locale"
import Flex from "@pages/components/Flex"
import { type ElTableRowScope } from "@pages/element-ui/table"
import { CATE_NOT_SET_ID, SiteMap } from "@util/site"
import { getRelatedCateId, identifyStatKey, isCate, isGroup, isSite } from "@util/stat"
import { Effect, ElTableColumn, ElText, ElTooltip } from "element-plus"
import { defineComponent } from "vue"
import TooltipSiteList from "./TooltipSiteList"

const renderMerged = (cateId: number, categories: timer.site.Cate[], merged: timer.stat.SiteRow[]) => {
    let cateName: string
    let isNotSet = false
    const siteMap = new SiteMap<string>()
    merged.forEach(row => isSite(row) && siteMap.put(row.siteKey, row.iconUrl))

    if (cateId === CATE_NOT_SET_ID) {
        cateName = t(msg => msg.shared.cate.notSet)
        isNotSet = true
    } else {
        const current = categories?.find(c => c.id === cateId)
        if (!current) return null
        cateName = current?.name
    }
    return (
        <ElTooltip
            effect={Effect.LIGHT}
            offset={10}
            placement="left"
            popperStyle={{ paddingInlineEnd: 0 }}
            v-slots={{
                content: () => <TooltipSiteList modelValue={merged} />,
                default: () => (
                    <ElText size="small" type={isNotSet ? 'info' : 'primary'}>
                        {cateName}
                    </ElText>
                ),
            }}
        />
    )
}

type Props = {
    onChange: (key: timer.site.SiteKey, newCate: number | undefined) => void,
}

const CateColumn = defineComponent<Props>(props => {
    const cate = useCategory()
    return () => cate.enabled ? (
        <ElTableColumn label={t(msg => msg.siteManage.column.cate)} minWidth={140}>
            {({ row }: ElTableRowScope<timer.stat.Row>) => {
                if (!row || isGroup(row)) return
                const { mergedRows } = row
                const cateId = getRelatedCateId(row)
                return (
                    <Flex key={`${identifyStatKey(row)}_${cateId}`} justify="center">
                        {isCate(row) && renderMerged(row.cateKey, cate.all, mergedRows ?? [])}
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
    ) : null
}, { props: ['onChange'] })

export default CateColumn