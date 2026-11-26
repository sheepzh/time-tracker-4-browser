import StatDay from '@/shared/day'
import { css } from '@emotion/css'
import { useDayOffset } from '@hooks'
import { useNamespace } from 'element-plus'
import { computed } from 'vue'

const TODAY_CLS = 'stat-today'
const NOT_SELECTED = ['current', 'start-date', 'end-date'].map(cls => `:not(.${cls})`).join('')

const dateTableNs = useNamespace('date-table')
const statTodayPopoverCls = css`
    & .${dateTableNs.b()} td.today${NOT_SELECTED} .${dateTableNs.be('cell', 'text')} {
        color: inherit;
        font-weight: inherit;
    }
    
    & .${dateTableNs.b()} td.available.${TODAY_CLS}${NOT_SELECTED} .${dateTableNs.be('cell', 'text')} {
        color: var(--el-color-primary);
        font-weight: 700;
    }
`

export const useStatToday = () => {
    const { dayStart } = useDayOffset()
    const today = computed(() => StatDay.today(dayStart.value))
    const cellClassName = (date: Date) => StatDay.ofLabel(date).equals(today.value) ? TODAY_CLS : ''
    return { today, cellClassName, statTodayPopoverCls }
}