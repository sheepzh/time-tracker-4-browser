/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { KanbanCard, KanbanIndicatorCell } from "@app/components/common/kanban"
import { t } from "@app/locale"
import { cvt2LocaleTime, periodFormatter } from "@app/util/time"
import { css } from '@emotion/css'
import { computed, defineComponent } from "vue"
import { useAnalysisRows, useAnalysisTarget, useAnalysisTimeFormat } from "../../context"
import type { AnalysisTarget } from "../../types"
import Calendar from "./Calendar"
import TargetInfo from "./TargetInfo"

type Summary = {
    focus: number
    visit: number
    day: number
    firstDay?: string
}

function computeSummary(target: AnalysisTarget | undefined, rows: timer.stat.Row[]): Summary | undefined {
    if (!target) return undefined

    const summary: Summary = { focus: 0, visit: 0, day: 0 }
    summary.firstDay = rows?.[0]?.date
    rows?.forEach(({ focus, time: visit }) => {
        summary.focus += focus
        summary.visit += visit
        focus && (summary.day += 1)
    })
    return summary
}

const DAYS_LABEL = t(msg => msg.analysis.summary.day)
const FOCUS_LABEL = t(msg => msg.analysis.common.focusTotal)
const VISIT_LABEL = t(msg => msg.analysis.common.visitTotal)

const CONTAINER_CLZ = css`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(calc(min(100%, max(500px, calc(50% - .5px)))), 1fr));
    background-color: var(--el-border-color);
    gap: 1px;
    & > div > div{
        background-color: var(--el-card-bg-color);
    }
`

const INDICATOR_AREA_CLZ = css`
    display: grid;
    gap: 1px;
    grid-template-columns: repeat(auto-fill, minmax(calc(min(100%, max(300px, calc(50% - .5px)))), 1fr));
`

const _default = defineComponent(() => {
    const target = useAnalysisTarget()
    const timeFormat = useAnalysisTimeFormat()
    const rows = useAnalysisRows()
    const summary = computed(() => computeSummary(target.value, rows.value))

    return () => (
        <KanbanCard title={t(msg => msg.analysis.summary.title)}>
            <div class={CONTAINER_CLZ}>
                <div class={INDICATOR_AREA_CLZ}>
                    <TargetInfo />
                    <KanbanIndicatorCell
                        mainName={FOCUS_LABEL}
                        mainValue={periodFormatter(summary.value?.focus, { format: timeFormat.value })}
                    />
                    <KanbanIndicatorCell
                        mainName={DAYS_LABEL}
                        mainValue={summary.value?.day?.toString?.() || '-'}
                        subTips={msg => msg.analysis.summary.firstDay}
                        subValue={summary.value?.firstDay ? `@${cvt2LocaleTime(summary.value?.firstDay)}` : ''}
                    />
                    <KanbanIndicatorCell mainName={VISIT_LABEL} mainValue={summary.value?.visit?.toString?.() || '-'} />
                </div>
                <div>
                    <Calendar />
                </div>
            </div>
        </KanbanCard>
    )
})

export default _default