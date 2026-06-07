import { css } from '@emotion/css'
import Flex from '@pages/components/Flex'
import { t, tN } from '@popup/locale'
import { ElInputNumber, ElText, useNamespace } from "element-plus"
import { defineComponent, ref, watch } from "vue"
import Option, { type PopoverInstance } from '../Option'
import { useStatOption } from '../stat/context'

const PercentageOption = defineComponent(() => {
    const option = useStatOption()
    const popover = ref<PopoverInstance>()

    watch(() => [option.showName, option.donutChart, option.topN], () => popover.value?.close())

    const inputNs = useNamespace('input')
    const topNInput = css`
        width: 70px;

        & .${inputNs.e('wrapper')} {
            padding-inline-start: 5px !important;
        }
    `

    return () => (
        <Option.Popover ref={popover}>
            <Option.Checkbox
                label={t(msg => msg.header.showSiteName)}
                modelValue={option.showName}
                onChange={v => option.showName = v}
            />
            <Option.Checkbox
                label={t(msg => msg.header.donutChart)}
                modelValue={option.donutChart}
                onChange={v => option.donutChart = v}
            />
            <Flex>
                <ElText size='small'>
                    {tN(msg => msg.header.showTopN, {
                        n: <ElInputNumber
                            class={topNInput}
                            size="small" controlsPosition='right'
                            step={5} min={5} max={100}
                            modelValue={option.topN}
                            onChange={v => v && (option.topN = v)}
                        />
                    })}
                </ElText>
            </Flex>
        </Option.Popover>
    )
})

export default PercentageOption
