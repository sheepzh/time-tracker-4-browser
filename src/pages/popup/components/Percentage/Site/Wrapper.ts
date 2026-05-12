import { EchartsWrapper } from '@hooks'
import { getInfoColor, getPrimaryTextColor } from "@pages/util/style"
import type {
    ComposeOption, LegendComponentOption, PieSeriesOption, TitleComponentOption, ToolboxComponentOption,
    TooltipComponentOption,
} from "echarts"
import type { ECElementEvent } from "echarts/core"
import type { TopLevelFormatterParams } from "echarts/types/dist/shared"
import {
    formatTooltip, generateSiteSeriesOption, generateTitleOption, generateToolbox, handleClick,
    type PieSeriesItemOption,
} from "../chart"
import { type PercentageResult } from "../query"

type EcOption = ComposeOption<
    | PieSeriesOption
    | TitleComponentOption
    | ToolboxComponentOption
    | TooltipComponentOption
    | LegendComponentOption
>

const maxWidth = 750

function calcPositionOfTooltip(container: HTMLElement, point: (number | string)[]) {
    const p = point[0] ?? 0
    const pN: number = typeof p === 'number' ? p : Number.parseFloat(p)
    const tooltip = container.children.item(1) as HTMLDivElement
    let tooltipWidth = 0
    if (tooltip) {
        tooltipWidth = tooltip.offsetWidth
        if (!tooltipWidth) {
            const styleWidth = tooltip.style.width
            tooltipWidth = Number.parseFloat(styleWidth.endsWith('px') ? styleWidth.substring(0, styleWidth.length) : styleWidth)
        }
        tooltipWidth = tooltipWidth || 0
    }
    if (maxWidth - pN - tooltipWidth - 10 < 0) {
        point[0] = pN - tooltipWidth - 20
    }
    return [...point]
}

export default class SiteWrapper extends EchartsWrapper<PercentageResult, EcOption> {
    private resultCache: PercentageResult | undefined

    init(container: HTMLDivElement): void {
        super.init(container)
        this.instance?.on('click', (params: ECElementEvent) => {
            const { type: evType, componentType, data } = params || {}
            if (evType !== 'click' || componentType !== 'series') return

            const { query: { dimension } = {}, date } = this.resultCache || {}
            dimension && handleClick(data as PieSeriesItemOption, date, dimension)
        })
    }

    protected generateOption(result: PercentageResult): Awaitable<EcOption> {
        this.resultCache = result
        if (!result) return {}

        const { rows } = result

        const series = generateSiteSeriesOption(rows, result, {
            radius: '50%',
            center: ['60%', '56%'],
            selectedMode: false,
            minShowLabelAngle: 3,
        })

        const textColor = getPrimaryTextColor()
        const inactiveColor = getInfoColor()

        const options: EcOption = {
            title: generateTitleOption(result),
            tooltip: {
                trigger: 'item',
                formatter: (params: TopLevelFormatterParams) => formatTooltip(result, params),
                position: (point: (number | string)[]) => calcPositionOfTooltip(this.getDom(), point)
            },
            legend: {
                type: 'scroll',
                orient: 'vertical',
                left: 15,
                top: 20,
                bottom: 50,
                textStyle: { color: textColor },
                pageTextStyle: { color: textColor },
                inactiveColor,
            },
            series,
            toolbox: generateToolbox(() => this.instance),
        }
        return options
    }
}