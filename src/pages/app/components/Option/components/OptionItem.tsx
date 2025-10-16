import { t, tN, type I18nKey } from "@app/locale"
import Flex from "@pages/components/Flex"
import { ElTag } from "element-plus"
import { computed, defineComponent, h, type VNode } from "vue"

type Props = {
    label: I18nKey | string
    defaultValue?: string | number | boolean | I18nKey
    required?: boolean
}

const OPTION_ITEM_SYMBOL = Symbol('OptionItem')

const computedDefValText = (defVal: Props['defaultValue']): string | number | undefined => {
    switch (typeof defVal) {
        case 'undefined': return undefined
        case 'string':
        case 'number': return defVal
        case 'boolean': return t(defVal ? msg => msg.option.yes : msg => msg.option.no)
        default: return t(defVal)
    }
}

const renderLabel = (label: Props['label'], param: any) => {
    return typeof label === 'string' ? label : tN(label, param)
}

export function isOptionItem(component: VNode): boolean {
    if (!component || typeof component !== 'object') return false
    const { type } = component
    return !!(type as any)[OPTION_ITEM_SYMBOL]
}

const OptionItem = defineComponent<Props>((props, { slots }) => {
    const defaultText = computed(() => computedDefValText(props.defaultValue))
    return () => {
        const param: Record<string, VNode> = {}
        Object.entries(slots).forEach(([k, slot]) => slot && (param[k === "default" ? "input" : k] = h(slot)))
        return (
            <div>
                <Flex class="option-line" align="center" justify="space-between" gap={10}>
                    <Flex class="option-label" align="center" gap={4}>
                        {!!props.required && <span class="option-item-required">*</span>}
                        {renderLabel(props.label, param)}
                    </Flex>
                    {defaultText.value && (
                        <a class="option-default">
                            {tN(
                                msg => msg.option.defaultValue,
                                { default: <ElTag size="small">{defaultText.value}</ElTag> },
                            )}
                        </a>
                    )}
                </Flex>
            </div>
        )
    }
}, { props: ['label', 'required', 'defaultValue'] })

const OptionItemAny = OptionItem as any
OptionItemAny[OPTION_ITEM_SYMBOL] = true

export default OptionItem