
/**
 * Copyright (c) 2024-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { useWindowSize } from "@hooks/useWindowSize"
import optionHolder from "@service/components/option-holder"
import { processAnimation, processAria, processRtl } from "@util/echarts"
import { type AriaComponentOption, type ComposeOption } from "echarts"
import { type ECharts, init } from "echarts/core"
import { ElLoading } from "element-plus"
import { type Ref, isRef, onMounted, ref, watch } from "vue"

type BaseEchartsOption = ComposeOption<AriaComponentOption>

export abstract class EchartsWrapper<BizOption, EchartsOption> {
    public instance: ECharts | undefined
    /**
     * true if need to re-generate option while size changing, or false
     */
    protected isSizeSensitize: boolean = false
    /**
     * true if need to clear all the before series when setOption
     */
    protected replaceSeries: boolean = false
    private lastBizOption: BizOption | undefined

    init(container: HTMLDivElement) {
        this.instance = init(container)
    }

    async render(biz: BizOption) {
        if (!this.instance) return
        this.lastBizOption = biz
        await this.innerRender()
    }

    private async innerRender() {
        const biz = this.lastBizOption
        const option = biz && await this.generateOption(biz) as (EchartsOption & BaseEchartsOption)
        if (!option) return

        await this.postChartOption(option)

        const replaceMerge = this.replaceSeries ? ['series'] : undefined
        this.instance?.setOption(option, { notMerge: false, replaceMerge })
    }

    protected async postChartOption(option: EchartsOption & BaseEchartsOption) {
        const { chartDecal, chartAnimationDuration } = await optionHolder.get() || {}
        processAnimation(option, chartAnimationDuration)
        processAria(option, chartDecal)
        processRtl(option)
    }

    async resize() {
        if (!this.instance) return
        this.isSizeSensitize && await this.innerRender()
        this.instance.resize()
    }

    protected getDom(): HTMLElement {
        return this.instance!.getDom()
    }

    protected abstract generateOption(biz: BizOption): Promise<EchartsOption> | EchartsOption

    protected getDomWidth(): number {
        return this.getDom()?.clientWidth ?? 0
    }
}


type WrapperResult<BizOption, EchartsOption, EW extends EchartsWrapper<BizOption, EchartsOption>> = {
    refresh: () => Promise<void>
    elRef: Ref<HTMLDivElement | undefined>
    wrapper: EW
}

export const useEcharts = <BizOption, EchartsOption, EW extends EchartsWrapper<BizOption, EchartsOption>>(
    Wrapper: new () => EW,
    fetch: (() => Promise<BizOption> | BizOption) | Ref<BizOption>,
    option?: {
        hideLoading?: boolean
        manual?: boolean
        afterInit?: (ew: EW) => void
    }): WrapperResult<BizOption, EchartsOption, EW> => {
    const elRef = ref<HTMLDivElement>()
    const wrapperInstance = new Wrapper()
    const {
        hideLoading = false,
        manual = false,
        afterInit,
    } = option || {}

    let refresh = async () => {
        const loading = hideLoading ? null : ElLoading.service({ target: elRef.value })
        try {
            const option = isRef(fetch) ? fetch.value : await fetch()
            await wrapperInstance.render(option)
        } finally {
            loading?.close?.()
        }
    }
    onMounted(() => {
        const target = elRef.value
        target && wrapperInstance.init(target)
        afterInit?.(wrapperInstance)
        !manual && refresh()
        isRef(fetch) && watch(fetch, refresh)
    })

    const { width, height } = useWindowSize()
    watch([width, height], () => wrapperInstance?.resize?.())

    return {
        refresh,
        elRef,
        wrapper: wrapperInstance,
    }
}