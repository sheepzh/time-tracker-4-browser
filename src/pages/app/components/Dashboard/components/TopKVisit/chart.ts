import { tooltipDot } from '@app/util/echarts'
import { generateSiteLabel } from '@util/site'
import type { BarSeriesOption, ComposeOption, PieSeriesOption, TooltipComponentOption } from 'echarts'
import { isBizOption } from './context'

type EcOption = ComposeOption<
    | TooltipComponentOption
    | PieSeriesOption
    | BarSeriesOption
>

export const tooltipOption = (): EcOption['tooltip'] => (
    {
        show: true,
        borderWidth: 0,
        formatter(params) {
            const param = Array.isArray(params) ? params[0] : params
            if (!param) return ''
            const { color, data } = param
            if (!isBizOption(data)) return ''
            const { value, host, alias } = data
            return `${tooltipDot(color)} ${generateSiteLabel(host, alias)}<br/><b>${value}</b>`
        }
    }
)