import { EchartsWrapper } from '@hooks'
import { CONFINE_TOOLTIP_OPTION, getInfoColor, getPrimaryTextColor } from "@pages/util/style"
import { CATE_NOT_SET_ID } from "@util/site"
import { isCate } from "@util/stat"
import type {
    ComposeOption, LegendComponentOption, PieSeriesOption, TitleComponentOption, ToolboxComponentOption,
    TooltipComponentOption,
} from "echarts"
import type { ECElementEvent } from "echarts/core"
import {
    adaptDonutSeries, formatTooltip, generateSiteSeriesOption, generateTitleOption, generateToolbox,
    handleClick, isOther, type PieSeriesItemOption,
} from "../chart"
import type { PercentageResult } from '../types'

type EcOption = ComposeOption<
    | PieSeriesOption
    | TitleComponentOption
    | ToolboxComponentOption
    | TooltipComponentOption
    | LegendComponentOption
>

type SelectChangeEvent = {
    type: 'selectchanged'
    fromAction: 'select' | 'unselect'
    fromActionPayload: {
        seriesIndex: number
        dataIndexInside: number
    }
}

export default class CateWrapper extends EchartsWrapper<PercentageResult, EcOption> {
    private resultCache: PercentageResult | undefined
    private selectedCache: number | undefined

    override init(container: HTMLDivElement): void {
        super.init(container)

        this.instance?.on('selectchanged', ev => {
            const { type, fromAction, fromActionPayload } = (ev as SelectChangeEvent) || {}
            const { seriesIndex, dataIndexInside } = fromActionPayload || {}
            if (type !== 'selectchanged' || seriesIndex !== 0) return

            if (fromAction === 'unselect') {
                this.handleSelect(undefined)
                return
            }

            const option = this.instance?.getOption() as EcOption
            const selectedItem = (option.series as PieSeriesOption[])?.[0]?.data?.[dataIndexInside] as PieSeriesItemOption
            const { row } = selectedItem ?? {}
            const selectedId = !isOther(row) && isCate(row) ? row.cateKey : undefined
            selectedId && this.handleSelect(selectedId)
        })

        this.instance?.on('click', (ev: ECElementEvent) => {
            const { type: evType, componentType, seriesIndex, data } = ev || {}
            if (evType !== 'click' || componentType !== 'series' || seriesIndex !== 1) {
                return
            }

            const { query: { dimension } = {}, date } = this.resultCache || {}
            dimension && handleClick(data as PieSeriesItemOption, date, dimension)
        })
    }

    protected async generateOption(result: PercentageResult): Promise<EcOption> {
        // Let not set to the end
        const rows = result.rows.filter(isCate).sort((_, a) => a.cateKey === CATE_NOT_SET_ID ? -1 : 0)
        this.resultCache = { ...result, rows }

        return this.generateInner()
    }

    private async generateInner(): Promise<EcOption> {
        const result = this.resultCache

        if (!result) return {}

        const { rows, query, option: { donutChart }, cateNameMap } = result
        const { dimension } = query
        const selected: tt4b.stat.Row | undefined = this.selectedCache
            ? rows.filter(isCate).filter(r => r.cateKey === this.selectedCache)[0]
            : undefined

        const textColor = getPrimaryTextColor()
        const inactiveColor = getInfoColor()

        let legend: LegendComponentOption = {
            type: 'scroll',
            orient: 'vertical',
            left: '5%',
            top: 50,
            bottom: 50,
            textStyle: { color: textColor, width: 120, overflow: 'truncate' },
            pageTextStyle: { color: textColor },
            inactiveColor,
            data: rows.filter(isCate).map(({ cateKey }) => ({ name: String(cateNameMap[cateKey] ?? cateKey), cateKey })),
        }

        const series: PieSeriesOption[] = [{
            type: "pie",
            center: selected ? ['15%', '28%'] : ['58%', '56%'],
            selectedMode: 'single',
            selectedOffset: 5,
            startAngle: 180,
            data: rows.filter(isCate).map(row => ({
                value: row[dimension], row,
                selected: row.cateKey === selected?.cateKey,
                name: String(cateNameMap[row.cateKey ?? ''] ?? ''),
            } satisfies PieSeriesItemOption)),
            emphasis: {
                itemStyle: {
                    shadowBlur: 10,
                    shadowOffsetX: 0,
                    shadowColor: "rgba(0, 0, 0, 0.5)",
                },
            },
            minShowLabelAngle: 0,
            label: {
                show: !selected,
                color: textColor,
                width: 200,
                overflow: 'truncate',
                position: selected ? 'inner' : 'outer',
                fontSize: selected ? 10 : undefined,
            },
            // not display as donut chart if selected
            ...adaptDonutSeries(donutChart, selected ? '30%' : '55%', selected ? 0.3 : undefined),
        }]
        if (selected) {
            let mergedRows = (selected.mergedRows ?? []).sort((a, b) => b[dimension] - a[dimension])

            const siteSeries = generateSiteSeriesOption(mergedRows, result, {
                center: ['60%', '58%'],
                radius: '55%',
                minShowLabelAngle: 3,
                selectedMode: false,
                label: { width: 120 },
            })

            legend = {
                type: 'scroll',
                orient: 'vertical',
                left: '5%',
                top: '48%',
                bottom: 50,
                textStyle: { color: textColor, width: 120, overflow: 'truncate' },
                pageTextStyle: { color: textColor },
                inactiveColor,
                data: siteSeries.data?.map(val => ({ name: (val as any).name })),
            }
            series.push(siteSeries)
        }

        const titleSuffix: string | undefined = this.selectedCache && this.selectedCache !== CATE_NOT_SET_ID ? cateNameMap[this.selectedCache] : undefined
        const option: EcOption = {
            title: generateTitleOption(result, titleSuffix),
            legend,
            tooltip: {
                ...CONFINE_TOOLTIP_OPTION,
                formatter: params => formatTooltip(result, params),
            },
            series,
            toolbox: generateToolbox(() => this.instance),
        }
        return option
    }

    private async handleSelect(selectedId: number | undefined) {
        this.selectedCache = selectedId
        const option = await this.generateInner()
        await this.postChartOption(option)
        this.instance?.setOption(option, true, true)
    }
}
