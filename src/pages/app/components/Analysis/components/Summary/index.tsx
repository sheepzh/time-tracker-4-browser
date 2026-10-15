/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { useAnalysisRows, useAnalysisTimeFormat } from "@app/components/Analysis/context"
import { KanbanCard, KanbanIndicatorCell } from '@app/components/common/kanban'
import { t } from '@app/locale'
import { cvt2LocaleDate, periodFormatter } from '@app/util/time'
import { css } from '@emotion/css'
import { Grid } from '@pages/components'
import { computed, defineComponent } from "vue"
import Calendar from "./Calendar"
import TargetInfo from "./TargetInfo"

type Summary = {
    focus: number
    visit: number
    day: number
    firstDay?: string
}

const computeSummary = (rows: tt4b.stat.Row[]) => rows.reduce((summary, e) => {
    summary.focus += e.focus
    summary.visit += e.time
    e.focus && summary.day++
    return summary
}, { focus: 0, visit: 0, day: 0, firstDay: rows[0]?.date } satisfies Summary)

const DAYS_LABEL = t(msg => msg.analysis.summary.day)
const FOCUS_LABEL = t(msg => msg.analysis.common.focusTotal)
const VISIT_LABEL = t(msg => msg.analysis.common.visitTotal)

const _default = defineComponent(() => {
    const timeFormat = useAnalysisTimeFormat()
    const rows = useAnalysisRows()
    const summary = computed(() => rows.value && computeSummary(rows.value))
    const containerCls = css`
        & > div > div {
            background-color: var(--el-card-bg-color);
        }
    `

    return () => (
        <KanbanCard title={msg => msg.analysis.summary.title}>
            <Grid
                class={containerCls}
                rowGap={1} columnGap={[1, 1]}
                bgColor='var(--el-border-color)'
                minColumnWidth="min(100%, max(500px, calc(50% - .5px)))"
                maxColumnWidth="1fr"
            >
                <Grid
                    rowGap={1} columnGap={[1, 1]}
                    minColumnWidth='calc(min(100%, max(300px, calc(50% - .5px))))'
                    maxColumnWidth='1fr'
                >
                    <TargetInfo />
                    <KanbanIndicatorCell
                        mainName={FOCUS_LABEL}
                        mainValue={periodFormatter(summary.value?.focus, { format: timeFormat.value })}
                    />
                    <KanbanIndicatorCell
                        mainName={DAYS_LABEL}
                        mainValue={summary.value?.day.toString() ?? '-'}
                        subTips={msg => msg.analysis.summary.firstDay}
                        subValue={`@${cvt2LocaleDate(summary.value?.firstDay)}`}
                    />
                    <KanbanIndicatorCell mainName={VISIT_LABEL} mainValue={summary.value?.visit.toString() ?? '-'} />
                </Grid>
                <div>
                    <Calendar />
                </div>
            </Grid>
        </KanbanCard>
    )
})

export default _default