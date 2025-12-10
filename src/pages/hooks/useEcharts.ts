
/**
 * Copyright (c) 2024-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import optionHolder from "@service/components/option-holder"
import { processAnimation, processAria, processFont, processRtl } from "@util/echarts"
import { type AriaComponentOption, type ComposeOption, SeriesOption, TitleComponentOption } from "echarts"
import { type ECharts, init } from "echarts/core"
import { ElLoading } from "element-plus"
import { type Ref, type WatchSource, isRef, onMounted, ref, watch } from "vue"
import { useElementSize } from './useElementSize'
import { useWindowSize } from "./useWindowSize"

type BaseEchartsOption = ComposeOption<
    | AriaComponentOption
    | TitleComponentOption
    | SeriesOption
>

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
    /**
     * Fix the font family
     * @see https://github.com/sheepzh/time-tracker-4-browser/issues/623
     */
    private textFontFamily: string | undefined

    init(container: HTMLDivElement) {
        this.instance = init(container)
        this.textFontFamily = getComputedStyle(container).fontFamily
    }

    async render(biz: BizOption) {
        if (!this.instance) return
        this.lastBizOption = biz
        await this.innerRender()
    }

    private async innerRender() {
        const biz = this.lastBizOption
        const option = biz && await this.generateOption(biz)
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
        this.textFontFamily && processFont(option, this.textFontFamily)
    }

    async resize() {
        if (!this.instance) return
        this.isSizeSensitize && await this.innerRender()
        this.instance.resize()
    }

    protected getDom(): HTMLElement {
        return this.instance!.getDom()
    }

    protected abstract generateOption(biz: BizOption): Awaitable<EchartsOption>

    protected getDomWidth(): number {
        return this.getDom()?.clientWidth ?? 0
    }
}


type WrapperResult<BizOption, EchartsOption, EW extends EchartsWrapper<BizOption, EchartsOption>> = {
    elRef: Ref<HTMLDivElement | undefined>
    wrapper: EW
}

export const useEcharts = <BizOption, EchartsOption, EW extends EchartsWrapper<BizOption, EchartsOption>>(
    Wrapper: new () => EW,
    fetch: (() => Promise<BizOption> | BizOption) | Ref<BizOption>,
    option?: {
        hideLoading?: boolean
        manual?: boolean
        afterInit?: ArgCallback<EW>,
        deps?: WatchSource | WatchSource[],
    }): WrapperResult<BizOption, EchartsOption, EW> => {
    const elRef = ref<HTMLDivElement>()
    const wrapperInstance = new Wrapper()
    const {
        hideLoading = false,
        manual = false,
        afterInit,
        deps,
    } = option ?? {}

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

    deps && watch(deps, refresh)

    const { width: winW, height: winH } = useWindowSize()
    const { width: elW, height: elH } = useElementSize(elRef, { debounce: 50 })
    watch([winW, winH, elW, elH], () => wrapperInstance?.resize?.())

    return { elRef, wrapper: wrapperInstance }
}