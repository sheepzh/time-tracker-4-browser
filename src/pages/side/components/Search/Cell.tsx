import StatDay from '@/shared/day'
import { type DateCell, useNamespace } from "element-plus"
import type { FunctionalComponent } from 'vue'

const DOT_SIZE = '3px'
const DATE_SIZE = '22px'

const Cell: FunctionalComponent<{ cell: DateCell, dataDates: string[] }> = ({ cell, dataDates }) => {
    const { renderText, text, date } = cell
    const dateStr = date && StatDay.ofLabel(date).toString()
    const hasData = !!dateStr && dataDates.includes(dateStr)
    const ns = useNamespace('date-table-cell')

    return () => (
        <div class={ns.b()}>
            <span
                class={ns.e('text')}
                style={{ width: DATE_SIZE, height: DATE_SIZE, lineHeight: DATE_SIZE }}
            >{renderText ?? text}</span>
            {hasData && <span style={{
                position: 'absolute',
                width: DOT_SIZE,
                height: DOT_SIZE,
                background: 'var(--el-color-primary)',
                borderRadius: '50%',
                bottom: '1px',
                left: '50%',
                transform: 'translateX(-50%)',
            }} />}
        </div>
    )
}

export default Cell
