import { t, tN, type I18nKey } from "@app/locale"
import { css } from '@emotion/css'
import { MediaSize, useMediaSize } from '@hooks/useMediaSize'
import Flex from "@pages/components/Flex"
import { colorVariant } from '@pages/util/style'
import { ElTag, useNamespace } from "element-plus"
import { computed, defineComponent, h, type StyleValue, type VNode } from "vue"

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

const TAG_STYLE: StyleValue = { height: '20px', marginInlineStart: '4px' }

const renderLabel = (label: Props['label'], param: any) => {
    return typeof label === 'string' ? label : tN(label, param)
}

export function isOptionItem(component: VNode): boolean {
    if (!component || typeof component !== 'object') return false
    const { type } = component
    return !!(type as any)[OPTION_ITEM_SYMBOL]
}

const useStyle = () => {
    const inputNs = useNamespace('input')
    const selectNs = useNamespace('select')
    const dateEditNs = useNamespace('date-edit')
    const dividerNs = useNamespace('divider')

    const lineCls = css`
        & {
            .${selectNs.b()} {
                display: inline-flex;
                height: 28px;
                min-width: 120px;
                width: 120px;
                .${selectNs.e('wrapper')} {
                    width: 100%;
                }
            }
            .${inputNs.m('small')} {
                height: 28px;
                .${inputNs.e('wrapper')} {
                    height: 26px;
                }
            }
            .${dateEditNs.m('time')} {
                width: 100px;
                .${dateEditNs.e('prefix')} {
                    width: 16px;
                    margin-inline-start: 5px;
                }
            }

            i {
                margin: 0 2px;
                font-size: 13px !important;
            }
        }
    `

    const smCls = css`
        & {
            .${dividerNs.m('horizontal')} {
                margin: 12px 0;
            }
            .${selectNs.b()},.${inputNs.b()} {
                margin-inline-start: 4px !important;
            }
        }
    `

    return { lineCls, smCls }
}

const OptionItem = defineComponent<Props>((props, { slots }) => {
    const defaultText = computed(() => computedDefValText(props.defaultValue))
    const mediaSize = useMediaSize()
    const isSmScreen = computed(() => mediaSize.value <= MediaSize.sm)
    const { lineCls, smCls } = useStyle()

    return () => {
        const param: Record<string, VNode> = {}
        Object.entries(slots).forEach(([k, slot]) => slot && (param[k === "default" ? "input" : k] = h(slot)))
        return (
            <Flex class={[lineCls, isSmScreen.value && smCls]} align="center" justify="space-between" gap={10}>
                <Flex align="center" color='text-primary' gap={4} wrap lineHeight={32}>
                    {!!props.required && <span style={{ color: colorVariant('danger'), marginInlineEnd: 4 }}>*</span>}
                    {renderLabel(props.label, param)}
                </Flex>
                {defaultText.value && !isSmScreen.value && (
                    <Flex as='a' color='text-primary'>
                        {tN(msg => msg.option.defaultValue, {
                            default: <ElTag size="small" style={TAG_STYLE}>{defaultText.value}</ElTag>
                        })}
                    </Flex>
                )}
            </Flex>
        )
    }
}, { props: ['label', 'required', 'defaultValue'] })

const OptionItemAny = OptionItem as any
OptionItemAny[OPTION_ITEM_SYMBOL] = true

export default OptionItem