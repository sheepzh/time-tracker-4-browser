import { getSeriesPalette, tooltipDot } from "@app/util/echarts"
import { EchartsWrapper } from "@hooks"
import { getPrimaryTextColor } from '@pages/util/style'
import { generateSiteLabel } from "@util/site"
import type { ComposeOption, GridComponentOption, PieSeriesOption, TooltipComponentOption } from "echarts"
import type { BizOption } from "../context"

type EcOption = ComposeOption<
    | PieSeriesOption
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

const generateOption = (data: BizOption[]): EcOption => {
    const textColor = getPrimaryTextColor()
    return {
        tooltip: tooltipOption(),
        series: {
            top: '10%',
            height: '90%',
            name: 'TopK',
            type: 'pie',
            radius: [20, 80],
            center: ['50%', '50%'],
            roseType: 'area',
            color: getSeriesPalette(),
            itemStyle: {
                borderRadius: 4,
            },
            label: { color: textColor },
            data: data,
        }
    }
}

class Wrapper extends EchartsWrapper<BizOption[], EcOption> {
    protected isSizeSensitize: boolean = true
    generateOption = (option: BizOption[]) => {
        if (!option?.length) return {}
        const domWidth = this.getDomWidth()
        if (!domWidth) return {}
        return generateOption(option)
    }
}

export default Wrapper
