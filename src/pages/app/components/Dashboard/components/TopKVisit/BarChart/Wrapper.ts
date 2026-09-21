import { getStepColors } from "@app/util/echarts"
import { EchartsWrapper } from "@hooks"
import type { BarSeriesOption, ComposeOption, GridComponentOption, TooltipComponentOption } from "echarts"
import { tooltipOption } from '../chart'
import type { BizOption } from "../context"

type EcOption = ComposeOption<
    | BarSeriesOption
    | GridComponentOption
    | TooltipComponentOption
>

class Wrapper extends EchartsWrapper<BizOption[], EcOption> {
    protected override isSizeSensitize: boolean = true
    override generateOption(data: BizOption[]): EcOption {
        data.sort((a, b) => a.value - b.value)
        const max = Math.max(0, ...data.map(v => v.value))
        const hosts = data.map(v => v.host)
        const margin = 8
        const domWidth = this.getDomWidth()
        const chartW = domWidth * (100 - margin * 2) / 100
        return {
            tooltip: tooltipOption(),
            grid: { left: '5%', right: '5%', bottom: '3%', top: '8%', },
            xAxis: {
                type: "value",
                minInterval: 1,
                axisLabel: { show: false },
                splitLine: { show: false },
                min: 0,
                max: max,
            },
            yAxis: {
                type: "category",
                data: hosts,
                axisLabel: { show: false },
                axisTick: { show: false },
                axisLine: { show: false },
            },
            series: {
                type: "bar",
                barWidth: '100%',
                data: data.map((row, idx) => {
                    const isBottom = idx === 0
                    const isTop = idx === data.length - 1
                    const { value = 0 } = row || {}
                    const labelW = (value / max) * chartW - 8
                    return {
                        ...row,
                        label: { show: labelW >= 50, width: labelW },
                        itemStyle: {
                            borderRadius: [
                                isTop ? 5 : 0, isTop ? 5 : 0, 5, isBottom ? 5 : 0
                            ]
                        },
                    }
                }),
                label: {
                    position: 'insideRight',
                    overflow: "truncate",
                    ellipsis: '...',
                    minMargin: 5,
                    padding: [0, 4, 0, 0],
                },
                colorBy: 'data',
                color: getStepColors(data.length, 1.5),
            },
        }
    }
}

export default Wrapper