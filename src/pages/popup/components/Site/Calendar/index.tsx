import { listSiteStats } from '@api/sw/stat'
import { periodFormatter } from '@app/util/time'
import { css } from '@emotion/css'
import { useRequest } from '@hooks'
import Flex from '@pages/components/Flex'
import { t } from '@popup/locale'
import { toMap } from '@util/array'
import { formatPeriodCommon, formatTime, formatTimeYMD, MILL_PER_WEEK } from '@util/time'
import { CalendarDateType, ElCalendar, ElText, useNamespace } from 'element-plus'
import { computed, defineComponent, FunctionalComponent, ref, Teleport } from 'vue'
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

const Cell: FunctionalComponent<{ date: Date, rows: Record<string, tt4b.stat.Row> }> = ({ date, rows }) => {
    const { focus } = rows[formatTimeYMD(date)] ?? {}
    return (
        <Flex justify='space-between' align='center' height='100%'>
            <span>{date.getDate()}</span>
            <Flex>
                <ElText size='small' type='primary'>
                    {focus !== undefined ? periodFormatter(focus, { format: 'auto' }) : ''}
                </ElText>
            </Flex>
        </Flex>
    )
}

const cvtStatQuery = (site: tt4b.site.SiteKey): tt4b.stat.SiteQuery => {
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
    const current = ref(new Date())
    const dateRange = computed<[string, string]>(() => {
        const v = current.value
        const start = new Date(v.getFullYear(), v.getMonth(), 1, 0, 0, 0, 0)
        start.setTime(start.getTime() - MILL_PER_WEEK)
        const end = new Date(v.getFullYear(), v.getMonth() + 1, 0, 0, 0, 0, 0)
        end.setTime(end.getTime() + MILL_PER_WEEK)
        return [formatTimeYMD(start), formatTimeYMD(end)]
    })
    const { data: rows } = useRequest(async () => {
        const s = site.value
        if (!s) return {}
        const list = await listSiteStats({ ...cvtStatQuery(s), date: dateRange.value })
        return toMap(list, l => l.date)
    }, { deps: [dateRange, site], defaultValue: {} })

    const row = computed(() => rows.value[formatTimeYMD(current.value)])

    const calendarCls = useCalendarStyle()

    return () => (
        <Flex flex={1} gap={15} column>
            <ElText type='primary' style={{ fontSize: '24px' }}>
                {formatTime(current.value, t(msg => msg.calendar.dateFormat))} - {formatPeriodCommon(row.value?.focus ?? 0, true)}
            </ElText>
            <Flex flex={1}>
                <ElCalendar
                    modelValue={current.value}
                    onUpdate:modelValue={v => current.value = v}
                    controllerType='button'
                    class={calendarCls}
                    v-slots={{
                        'date-cell': ({ data: { date } }: CalendarCellParam) => <Cell date={date} rows={rows.value} />
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