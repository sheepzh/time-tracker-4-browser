import { t } from '@app/locale'
import { useTabGroups } from "@hooks"
import { Flex } from '@pages/components'
import { cvtGroupColor } from '@pages/util/style'
import { isGroup } from "@util/stat"
import { ElTableColumn } from "element-plus"
import { type CSSProperties, defineComponent, type FunctionalComponent } from "vue"
import type { RowData } from '../../types'

type CellProps = {
    row: tt4b.stat.Row
    map: Record<number, chrome.tabGroups.TabGroup>
}
const DOT_STYLE: CSSProperties = {
    display: 'inline-block',
    height: '18px',
    width: '18px',
    borderRadius: '4px',
}
const GroupCell: FunctionalComponent<CellProps> = ({ row, map }) => {
    if (!isGroup(row)) return null
    const { groupKey } = row
    const { color, title } = map[groupKey] ?? {}
    return <Flex inline justify="center" align="center" gap={4}>
        <span style={{ backgroundColor: cvtGroupColor(color), ...DOT_STYLE }} />
        {title ?? `ID: ${groupKey}`}
    </Flex>
}

const GroupColumn = defineComponent<{}>(() => {
    const { groupMap } = useTabGroups()

    return () => (
        <ElTableColumn
            align="center"
            label={t(msg => msg.item.group)}
            width={140}
            v-slots={({ row }: RowData) => <GroupCell row={row} map={groupMap.value} />}
        />
    )
})

export default GroupColumn