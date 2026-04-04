import { getStepColors, tooltipDot } from "@app/util/echarts"
import { EchartsWrapper } from "@hooks"
import { generateSiteLabel } from "@util/site"
import type { BarSeriesOption, ComposeOption, GridComponentOption, TooltipComponentOption } from "echarts"
import { BizOption } from "../context"

type EcOption = ComposeOption<
    | BarSeriesOption
    | GridComponentOption
    | TooltipComponentOption
>

const tooltipOption = (): EcOption['tooltip'] => (
    {
        show: true,
        borderWidth: 0,
        formatter(params: any) {
            const color = params?.color || "#000"
            const point = tooltipDot(color)
            const visit = params.data?.value || 0
            const host = params.data?.host || ''
            const alias = params.data?.alias || ''
            const hostLabel = generateSiteLabel(host, alias)
            return `${point} ${hostLabel}<br/><b>${visit}</b>`
        }
    }
)

const generateOption = (data: BizOption[], domWidth: number): EcOption => {
    data = data?.sort((a, b) => (b?.value ?? 0) - (a?.value ?? 0))
    const max = Math.max(...(data?.map(v => v.value) || []))
    const hosts = data?.sort((a, b) => (a.value ?? 0) - (b?.value ?? 0))?.map(v => v.host) || []
    const margin = 8
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
                formatter: (param: any) => {
                    const { host, name } = (param?.data || {})
                    return name || host
                },
            },
            colorBy: 'data',
            color: getStepColors(data.length, 1.5),
        },
    }
}

class Wrapper extends EchartsWrapper<BizOption[], EcOption> {
    protected isSizeSensitize: boolean = true
    generateOption = (option: BizOption[]) => {
        if (!option?.length) return {}
        const domWidth = this.getDomWidth()
        if (!domWidth) return {}
        return generateOption(option, domWidth)
    }
}

export default Wrapper