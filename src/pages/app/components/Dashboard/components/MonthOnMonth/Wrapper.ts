import { getCompareColor, getDiffColor, tooltipDot } from "@app/util/echarts"
import { cvt2LocaleTime } from "@app/util/time"
import { EchartsWrapper } from "@hooks/useEcharts"
import { formatPeriodCommon } from "@util/time"
import {
    type BarSeriesOption,
    type ComposeOption,
    type GridComponentOption,
    type LegendComponentOption,
    type TooltipComponentOption,
} from "echarts"
import { type TopLevelFormatterParams } from "echarts/types/dist/shared"

type EcOption = ComposeOption<
    | BarSeriesOption
    | GridComponentOption
    | TooltipComponentOption
    | LegendComponentOption
>

type _Value = {
    value: number
    row: Row
}

function optionOf(lastPeriodItems: Row[], thisPeriodItems: Row[], domWidth: number): EcOption {
    const [color1, color2] = getCompareColor()
    const [incColor, decColor] = getDiffColor()

    return {
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            borderWidth: 0,
            formatter(params: TopLevelFormatterParams) {
                if (!Array.isArray(params)) return ''
                const [thisItem, lastItem] = params.map(v => v.data as _Value).map(v => v.row) || []
                const [thisColor, lastColor] = params.map(v => v.color)
                const { date: thisDate, total: thisVal } = thisItem || {}
                const { date: lastDate, total: lastVal } = lastItem || {}
                const lastStr = `${tooltipDot(lastColor as string)}&emsp;${cvt2LocaleTime(lastDate)}&emsp;<b>${formatPeriodCommon(lastVal)}</b>`
                let thisStr = `${tooltipDot(thisColor as string)}&emsp;${cvt2LocaleTime(thisDate)}&emsp;<b>${formatPeriodCommon(thisVal)}</b>`
                if (lastVal) {
                    const delta = (thisVal - lastVal) / lastVal * 100
                    let deltaStr = delta.toFixed(1) + '%'
                    if (delta >= 0) deltaStr = '+' + deltaStr
                    const fontColor = delta >= 0 ? incColor : decColor
                    thisStr += `&emsp;<font style="color: ${fontColor};">${deltaStr}</font>`
                }
                return `${thisStr}<br/>${lastStr}`
            },
        },
        grid: {
            left: '5%',
            right: '5%',
            bottom: '3%',
            top: '11%',
        },
        xAxis: {
            type: 'category',
            splitLine: { show: false },
            axisTick: { show: false },
            axisLine: { show: false },
            axisLabel: { show: false },
        },
        yAxis: [
            {
                type: 'value',
                axisLabel: { show: false },
                splitLine: { show: false },
            }
        ],
        series: [
            {
                name: "This Month",
                stack: "one",
                type: 'bar',
                barCategoryGap: `${domWidth < 500 ? 30 : 55}%`,
                itemStyle: { color: color1 },
                data: thisPeriodItems.map((row, idx) => {
                    const otherIsEmpty = lastPeriodItems[idx].total === 0
                    return {
                        value: row.total, row,
                        itemStyle: { borderRadius: otherIsEmpty ? 10 : [10, 10, 0, 0] },
                    }
                }),
            }, {
                name: "Last Month",
                stack: "one",
                type: 'bar',
                itemStyle: { color: color2 },
                data: lastPeriodItems.map((row, idx) => {
                    const otherIsEmpty = thisPeriodItems[idx].total === 0
                    return {
                        value: -row.total, row,
                        itemStyle: { borderRadius: otherIsEmpty ? 10 : [0, 0, 10, 10] },
                    }
                }),
            },
        ],
    }
}

type Row = {
    date: string
    total: number
}

class Wrapper extends EchartsWrapper<[Row[], Row[]], EcOption> {
    protected isSizeSensitize: boolean = true

    generateOption([lastPeriodItems, thisPeriodItems]: [Row[], Row[]]) {
        const domWidth = this.getDomWidth()
        if (!domWidth) return {}
        return optionOf(lastPeriodItems, thisPeriodItems, domWidth)
    }
}

export default Wrapper