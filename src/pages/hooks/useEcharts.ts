
/**
 * Copyright (c) 2024-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { getOption } from "@api/sw/option"
import { processAnimation, processAria, processFont, processRtl } from "@util/echarts"
import type { AriaComponentOption, ComposeOption, SeriesOption, TitleComponentOption } from "echarts"
import { type ECharts, init } from "echarts/core"
import { type Ref, isRef, onMounted, ref, watch } from "vue"
import { useElementSize } from './useElementSize'
import { type RequestOption, useRequest } from './useRequest'
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
    protected lastBizOption: BizOption | undefined
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
        const { chartDecal, chartAnimationDuration } = await getOption()
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

type Options<EW> = Pick<RequestOption<never, never>, 'manual' | 'deps'> & {
    afterInit?: ArgCallback<EW>
}

export const useEcharts = <
    BizOption,
    EchartsOption,
    EW extends EchartsWrapper<BizOption, EchartsOption> = EchartsWrapper<BizOption, EchartsOption>,
    Data extends BizOption = BizOption,
>(
    Wrapper: new () => EW,
    fetch: (() => Awaitable<Data>) | Ref<Data>,
    { afterInit, manual, deps }: Options<EW> = {},
) => {
    const elRef = ref<HTMLDivElement>()
    const wrapper = new Wrapper()

    const data = isRef(fetch) ? fetch : useRequest(fetch, { manual, deps, loadingTarget: elRef }).data

    onMounted(() => {
        const target = elRef.value
        target && wrapper.init(target)
        afterInit?.(wrapper)

        watch(data, () => data.value && wrapper.render(data.value))
        // The element reference perhaps change, reinitialize again
        watch(elRef, () => elRef.value && wrapper.init(elRef.value))
    })

    const { width: winW, height: winH } = useWindowSize()
    const { width: elW, height: elH } = useElementSize(elRef, { debounce: 50 })
    watch([winW, winH, elW, elH], () => wrapper.resize())

    return { elRef, wrapper, data }
}