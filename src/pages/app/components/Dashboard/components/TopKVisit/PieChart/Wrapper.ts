import { getSeriesPalette } from "@app/util/echarts"
import { EchartsWrapper } from "@hooks"
import { getPrimaryTextColor } from '@pages/util/style'
import type { ComposeOption, GridComponentOption, PieSeriesOption, TooltipComponentOption } from "echarts"
import { tooltipOption } from '../chart'
import type { BizOption } from "../context"

type EcOption = ComposeOption<
    | PieSeriesOption
    | GridComponentOption
    | TooltipComponentOption
>

class Wrapper extends EchartsWrapper<BizOption[], EcOption> {
    protected override isSizeSensitize: boolean = true
    override generateOption = (data: BizOption[]): EcOption => ({
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
            itemStyle: { borderRadius: 4 },
            label: { color: getPrimaryTextColor() },
            data,
        }
    })
}

export default Wrapper
