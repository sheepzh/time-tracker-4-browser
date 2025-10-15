import { defaultAccessibility } from "@util/constant/option"
import { ElSwitch } from "element-plus"
import { defineComponent } from "vue"
import { type OptionInstance } from "../common"
import { useOption } from "../useOption"
import OptionItem from "./OptionItem"

function copy(target: timer.option.AccessibilityOption, source: timer.option.AccessibilityOption) {
    target.chartDecal = source.chartDecal
}

const _default = defineComponent((_, ctx) => {
    const { option } = useOption({ defaultValue: defaultAccessibility, copy })
    ctx.expose({
        reset: () => copy(option, defaultAccessibility())
    } satisfies OptionInstance)
    return () => (
        <OptionItem label={msg => msg.option.accessibility.chartDecal} defaultValue={false}>
            <ElSwitch modelValue={option.chartDecal} onChange={val => option.chartDecal = val as boolean} />
        </OptionItem>
    )
})

export default _default