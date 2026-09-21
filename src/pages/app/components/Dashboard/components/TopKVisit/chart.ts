import { tooltipDot } from '@app/util/echarts'
import { generateSiteLabel } from '@util/site'
import type { BarSeriesOption, ComposeOption, PieSeriesOption, TooltipComponentOption } from 'echarts'
import { isString } from 'typescript-guard'
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
        formatter(params: any) {
            const param = Array.isArray(params) ? params[0] : params
            if (!param) return ''
            const { color = '#000', data } = param
            const point = isString(color) ? tooltipDot(color) : ''
            const { value = 0, host = '', alias = '' } = isBizOption(data) ? data : {}
            const hostLabel = generateSiteLabel(host, alias)
            return `${point} ${hostLabel}<br/><b>${value}</b>`
        }
    }
)