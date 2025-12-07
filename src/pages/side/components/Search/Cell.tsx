import { formatTimeYMD } from '@util/time'
import { type DateCell, useNamespace } from "element-plus"
import { computed, defineComponent } from 'vue'

const DOT_SIZE = '3px'
const DATE_SIZE = '22px'

const Cell = defineComponent<{ cell: DateCell, dataDates: string[] }>(props => {
    const text = computed(() => {
        const { renderText, text } = props.cell
        return renderText ?? text
    })
    const hasData = computed(() => {
        const { date } = props.cell
        if (!date) return false
        const dateStr = formatTimeYMD(date)
        return props.dataDates.includes(dateStr)
    })
    const ns = useNamespace('date-table-cell')

    return () => (
        <div class={ns.b()}>
            <span
                class={ns.e('text')}
                style={{ width: DATE_SIZE, height: DATE_SIZE, lineHeight: DATE_SIZE }}
            >{text.value}</span>
            {hasData.value && <span style={{
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
}, { props: ['cell', 'dataDates'] })

export default Cell
