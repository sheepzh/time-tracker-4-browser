import ColumnHeader from "@app/components/common/ColumnHeader"
import { t } from "@app/locale"
import { ElTableColumn, ElTag, type RenderRowData, type TagProps } from "element-plus"
import { type FunctionalComponent } from "vue"
import type { JSX } from "vue/jsx-runtime"
import { ALL_TYPES } from "../../common"

const computeText = ({ type }: timer.site.SiteInfo): string => t(msg => msg.siteManage.type[type].name)

function computeType({ type }: timer.site.SiteInfo): TagProps["type"] | undefined {
    switch (type) {
        case 'merged': return 'info'
        case 'virtual': return 'success'
        default: return undefined
    }
}

const TypeColumn: FunctionalComponent = () => (
    <ElTableColumn
        minWidth={130}
        align="center"
        v-slots={{
            header: () => (
                <ColumnHeader
                    label={t(msg => msg.siteManage.column.type)}
                    v-slots={{
                        tooltipContent: () => ALL_TYPES
                            .map(type => `${t(msg => msg.siteManage.type[type].name)} - ${t(msg => msg.siteManage.type[type].info)}`)
                            .reduce<(string | JSX.Element)[]>((a, b) => {
                                a.length && a.push(<br />)
                                a.push(b)
                                return a
                            }, []),
                    }}
                />
            ),
            default: ({ row }: RenderRowData<timer.site.SiteInfo>) => (
                <ElTag size="small" type={computeType(row)}>
                    {computeText(row)}
                </ElTag>
            )
        }}
    />
)

export default TypeColumn