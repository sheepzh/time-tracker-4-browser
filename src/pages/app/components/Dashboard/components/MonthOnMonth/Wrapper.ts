import { ptFmt } from '@app/locale'
import { getCompareColor, getDiffColor, tooltipDot } from "@app/util/echarts"
import { EchartsWrapper } from "@hooks"
import { cvt2LocaleDate, fmtDur } from '@pages/util/time'
import type {
    BarSeriesOption, ComposeOption, GridComponentOption, LegendComponentOption, TooltipComponentOption,
} from "echarts"
import { createObjectGuard, isNumber, isString } from 'typescript-guard'

type EcOption = ComposeOption<
    | BarSeriesOption
    | GridComponentOption
    | TooltipComponentOption
    | LegendComponentOption
>

type Row = { date: string, total: number }
type DataExtend = { row: Row }
const isDataExtend = createObjectGuard<DataExtend>({
    row: createObjectGuard<Row>({ date: isString, total: isNumber })
})

function optionOf(lastPeriodItems: Row[], thisPeriodItems: Row[], domWidth: number): EcOption {
    const [color1, color2] = getCompareColor()
    const [incColor, decColor] = getDiffColor()
    const deltaFmt = ptFmt(1, { displaySign: true })

    return {
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            borderWidth: 0,
            formatter(params) {
                if (!Array.isArray(params)) return ''
                const [thisItem, lastItem] = params.map(v => isDataExtend(v.data) ? v.data.row : undefined)
                const [thisColor, lastColor] = params.map(v => v.color)
                const { date: thisDate, total: thisVal } = thisItem || {}
                const { date: lastDate, total: lastVal } = lastItem || {}
                const lastStr = `${tooltipDot(lastColor)}&emsp;${cvt2LocaleDate(lastDate)}&emsp;<b>${fmtDur(lastVal ?? 0)}</b>`
                let thisStr = `${tooltipDot(thisColor)}&emsp;${cvt2LocaleDate(thisDate)}&emsp;<b>${fmtDur(thisVal ?? 0)}</b>`
                if (lastVal && thisVal) {
                    const deltaPt = (thisVal - lastVal) / lastVal
                    const fontColor = deltaPt >= 0 ? incColor : decColor
                    thisStr += `&emsp;<font style="color: ${fontColor};">${deltaFmt.format(deltaPt)}</font>`
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
                    const otherIsEmpty = !lastPeriodItems[idx]?.total
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
                    const otherIsEmpty = !thisPeriodItems[idx]?.total
                    return {
                        value: -row.total, row,
                        itemStyle: { borderRadius: otherIsEmpty ? 10 : [0, 0, 10, 10] },
                    }
                }),
            },
        ],
    }
}

class Wrapper extends EchartsWrapper<[Row[], Row[]], EcOption> {
    protected override isSizeSensitize: boolean = true

    generateOption([lastPeriodItems, thisPeriodItems]: [Row[], Row[]]) {
        const domWidth = this.getDomWidth()
        if (!domWidth) return {}
        return optionOf(lastPeriodItems, thisPeriodItems, domWidth)
    }
}

export default Wrapper