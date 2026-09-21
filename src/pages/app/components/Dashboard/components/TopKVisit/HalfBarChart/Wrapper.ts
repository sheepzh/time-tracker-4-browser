import { getSeriesPalette } from '@app/util/echarts'
import { EchartsWrapper } from "@hooks"
import { getPrimaryTextColor } from '@pages/util/style'
import type { ComposeOption, GridComponentOption, PieSeriesOption, TooltipComponentOption } from "echarts"
import { tooltipOption } from '../chart'
import type { BizOption } from '../context'

type EcOption = ComposeOption<
    | PieSeriesOption
    | GridComponentOption
    | TooltipComponentOption>

class Wrapper extends EchartsWrapper<BizOption[], EcOption> {
    protected override isSizeSensitize: boolean = true
    override generateOption = (data: BizOption[]): EcOption => ({
        tooltip: tooltipOption(),
        series: {
            top: '10%',
            height: '90%',
            name: 'TopK',
            type: 'pie',
            radius: ['60%', '130%'],
            center: ['50%', '80%'],
            itemStyle: { borderRadius: 5 },
            startAngle: 180,
            endAngle: 360,
            color: getSeriesPalette(),
            label: { color: getPrimaryTextColor() },
            data,
        }
    })
}

export default Wrapper