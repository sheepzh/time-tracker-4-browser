import { cvtGroupColor } from "@api/chrome/tabGroups"
import { t } from "@app/locale"
import { useTabGroups } from "@hooks/useTabGroups"
import { isGroup } from "@util/stat"
import { ElTableColumn, ElTag, type RenderRowData } from "element-plus"
import { defineComponent, StyleValue } from "vue"

const GroupColumn = defineComponent(() => {
    const { groupMap } = useTabGroups()

    return () => (
        <ElTableColumn
            align="center"
            label={t(msg => msg.item.group)}
            width={140}
            v-slots={({ row }: RenderRowData<timer.stat.Row>) => {
                if (!isGroup(row)) return
                const { groupKey } = row
                const { color, title } = groupMap.value[groupKey] ?? {}
                return (
                    <ElTag
                        style={{
                            backgroundColor: cvtGroupColor(color),
                            color: 'var(--el-text-primary-color)',
                        } satisfies StyleValue}
                    >
                        {title ?? `ID: ${groupKey}`}
                    </ElTag>
                )
            }}
        />
    )
})

export default GroupColumn