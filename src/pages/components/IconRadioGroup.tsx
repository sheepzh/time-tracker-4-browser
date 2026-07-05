import { css } from '@emotion/css'
import { ElIcon, ElRadioButton, ElRadioGroup, ElTooltip, type RadioGroupProps, useNamespace } from 'element-plus'
import { type Component, type FunctionalComponent, h } from 'vue'

const useNarrowStyle = () => {
    const radioNs = useNamespace('radio')
    return css`
        & .${radioNs.be('button', 'inner')} {
            padding: 3px 5px;
        }
    `
}
const NARROW_CLS = useNarrowStyle()

export type IconRadioOption<T extends string> = {
    value: T
    icon: Component
    tooltip?: string
}

type Props = ModelValue<string> & Pick<RadioGroupProps, 'size'> & {
    narrow?: boolean
    iconSize?: number
    options: IconRadioOption<string>[]
}

const IconRadioGroup: FunctionalComponent<Props> = ({
    size, iconSize = 15, narrow,
    modelValue, onChange,
    options,
}) => (
    <ElRadioGroup
        size={size}
        modelValue={modelValue}
        onChange={val => onChange?.(val as string)}
    >
        {options.map(({ value, icon, tooltip }) => {
            const iconComp = <ElIcon size={iconSize}>{h(icon)}</ElIcon>
            return (
                <ElRadioButton value={value} class={narrow && NARROW_CLS} >
                    {tooltip ? <ElTooltip content={tooltip}>{iconComp}</ElTooltip> : iconComp}
                </ElRadioButton>
            )
        })}
    </ElRadioGroup>
)

IconRadioGroup.displayName = 'IconRadioGroup'

export default IconRadioGroup