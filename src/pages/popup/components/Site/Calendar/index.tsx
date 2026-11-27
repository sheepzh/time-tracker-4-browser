import { StatDay, statRangeStr, type StatRange } from '@/shared/day'
import { listSiteStats } from '@api/sw/stat'
import { css } from '@emotion/css'
import { useDayOffset, useRequest, useShadow } from '@hooks'
import { Flex } from '@pages/components'
import { cvt2LocaleDate, fmtDur } from '@pages/util/time'
import { toMap } from '@util/array'
import { CalendarDateType, ElCalendar, ElText, useNamespace } from 'element-plus'
import { computed, defineComponent, FunctionalComponent, Teleport } from 'vue'
import { SITE_SUMMARY_DROPDOWN_SLOT } from '../common'
import { useSite } from '../context'
import Dropdown from './Dropdown'

type CalendarCellParam = {
    data: {
        isSelected: boolean
        type: `${CalendarDateType}-month`
        day: string
        date: Date
    }
}

const Cell: FunctionalComponent<{ date: StatDay, rows: Record<string, tt4b.stat.Row> }> = ({ date, rows }) => {
    const { focus } = rows[date.toString()] ?? {}
    return (
        <Flex justify='space-between' align='center' height='100%'>
            <span>{date.d}</span>
            <Flex>
                <ElText size='small' type='primary'>
                    {focus !== undefined ? fmtDur(focus, { format: 'auto' }) : ''}
                </ElText>
            </Flex>
        </Flex>
    )
}

const cvtStatQuery = (site: tt4b.site.SiteKey): Omit<tt4b.stat.SiteQuery, 'remote'> => {
    const { host, type } = site
    if (type === 'merged') return { host, mergeHost: true }
    else if (type === 'virtual') return { host, virtual: true }
    else return { host }
}

const useCalendarStyle = () => {
    const calendarNs = useNamespace('calendar')

    return css`
        --el-calendar-cell-width: 30px;

        & .${calendarNs.e('body')} {
            padding-bottom: 0;
        }
    `
}

const Calendar = defineComponent<{}>(() => {
    const { site } = useSite()
    const { today } = useDayOffset()
    const [current, setCurrent] = useShadow(today)
    const dateRange = computed<StatRange>(() => {
        const v = current.value
        const start = v.monthStart().addDays(-7)
        const end = v.monthEnd().addDays(6)
        return start.rangeTo(end)
    })
    const { data: rows } = useRequest(async () => {
        const s = site.value
        if (!s) return {}
        const date = statRangeStr(dateRange.value)
        const list = await listSiteStats({ ...cvtStatQuery(s), date, remote: false })
        return toMap(list, l => l.date)
    }, { deps: [dateRange, site], defaultValue: {} })

    const row = computed(() => rows.value[current.value.toString()])

    const calendarCls = useCalendarStyle()

    return () => (
        <Flex flex={1} gap={15} column>
            <ElText type='primary' style={{ fontSize: '24px' }}>
                {cvt2LocaleDate(current.value)} - {fmtDur(row.value?.focus ?? 0)}
            </ElText>
            <Flex flex={1}>
                <ElCalendar
                    modelValue={current.value.toLabel()}
                    onUpdate:modelValue={v => setCurrent(StatDay.ofLabel(v))}
                    controllerType='button'
                    class={calendarCls}
                    v-slots={{
                        'date-cell': ({ data: { date } }: CalendarCellParam) => <Cell date={StatDay.ofLabel(date)} rows={rows.value} />
                    }}
                />
            </Flex>
            <Teleport defer to={`#${SITE_SUMMARY_DROPDOWN_SLOT}`}>
                <Dropdown />
            </Teleport>
        </Flex>
    )
})

export default Calendar