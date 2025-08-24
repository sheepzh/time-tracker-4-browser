import { EchartsWrapper } from "@hooks/useEcharts"
import { getInfoColor, getPrimaryTextColor } from "@pages/util/style"
import { t } from "@popup/locale"
import cateService from "@service/cate-service"
import { mergeDate } from "@service/stat-service/merge/date"
import { toMap } from "@util/array"
import { CATE_NOT_SET_ID } from "@util/site"
import { isCate } from "@util/stat"
import { type PieSeriesOption } from "echarts/charts"
import {
    type LegendComponentOption,
    type TitleComponentOption,
    type ToolboxComponentOption,
    type TooltipComponentOption,
} from "echarts/components"
import { type ComposeOption, type ECElementEvent } from "echarts/core"
import {
    formatTooltip, generateSiteSeriesOption, generateTitleOption, generateToolboxOption, handleClick, isOther,
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

type SelectChangeEvent = {
    type: 'selectchanged'
    fromAction: 'select' | 'unselect'
    fromActionPayload: {
        seriesIndex: number
        dataIndexInside: number
    }
}

export default class SiteWrapper extends EchartsWrapper<PercentageResult, EcOption> {
    private resultCache: PercentageResult | undefined
    private selectedCache: number | undefined

    init(container: HTMLDivElement): void {
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

        const { rows, query } = result
        const { dimension } = query
        const selected: timer.stat.Row | undefined = this.selectedCache
            ? rows.filter(isCate).filter(r => r.cateKey === this.selectedCache)[0]
            : undefined

        const textColor = getPrimaryTextColor()
        const inactiveColor = getInfoColor()

        const cates = await cateService.listAll()
        const cateNameMap = toMap(cates, c => c.id, c => c.name)
        cateNameMap[CATE_NOT_SET_ID] = t(msg => msg.shared.cate.notSet)

        let legend: LegendComponentOption = {
            type: 'scroll',
            orient: 'vertical',
            left: '5%',
            top: 50,
            bottom: 50,
            textStyle: { color: textColor },
            pageTextStyle: { color: textColor },
            inactiveColor,
            data: rows.filter(isCate).map(({ cateKey }) => ({ name: cateNameMap[cateKey] ?? `${cateKey}`, cateKey })),
        }

        const series: PieSeriesOption[] = [{
            type: "pie",
            center: selected ? ['15%', '28%'] : ['58%', '56%'],
            radius: selected ? '30%' : '55%',
            selectedMode: 'single',
            startAngle: 180,
            data: rows.filter(isCate).map(row => ({
                value: row[dimension], row,
                selected: row.cateKey === selected?.cateKey,
                name: cateNameMap[row.cateKey ?? ''],
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
                position: selected ? 'inner' : 'outer',
                fontSize: selected ? 10 : undefined,
            },
        }]
        if (selected) {
            let mergedRows = (selected?.mergedRows || []).sort((a, b) => (b[dimension] ?? 0) - (a[dimension] ?? 0))
            mergedRows = mergeDate(mergedRows)

            const siteSeries = generateSiteSeriesOption(mergedRows, result, {
                center: ['60%', '58%'],
                radius: '55%',
                minShowLabelAngle: 3,
                selectedMode: false,
            })

            legend = {
                type: 'scroll',
                orient: 'vertical',
                left: '5%',
                top: '48%',
                bottom: 50,
                textStyle: { color: textColor },
                pageTextStyle: { color: textColor },
                inactiveColor,
                data: siteSeries.data?.map(val => ({ name: (val as any).name })),
            }
            series.push(siteSeries)
        }

        const titleSuffix = this.selectedCache && this.selectedCache !== CATE_NOT_SET_ID ? cateNameMap[this.selectedCache] : undefined
        const option: EcOption = {
            title: generateTitleOption(result, titleSuffix),
            legend,
            tooltip: {
                show: true,
                formatter: (params: any) => formatTooltip(result, params),
            },
            series,
            toolbox: generateToolboxOption(),
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