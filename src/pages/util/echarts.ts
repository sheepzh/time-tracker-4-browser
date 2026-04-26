import {
    BarChart, CustomChart, EffectScatterChart, GaugeChart, LineChart, PieChart, ScatterChart,
} from "echarts/charts"
import {
    AriaComponent, DataZoomComponent, GridComponent, LegendComponent, TitleComponent, ToolboxComponent,
    TooltipComponent, VisualMapComponent,
} from "echarts/components"
import { use } from "echarts/core"
import { CanvasRenderer } from "echarts/renderers"

export const initEcharts = () => {
    use([
        CanvasRenderer,
        ToolboxComponent, AriaComponent, GridComponent, TooltipComponent, TitleComponent, VisualMapComponent, LegendComponent,
        DataZoomComponent,
        BarChart, PieChart, LineChart, ScatterChart, EffectScatterChart, CustomChart, GaugeChart,
    ])
}