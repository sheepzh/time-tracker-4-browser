import { css } from '@emotion/css'
import { ElIcon, ElRadioButton, ElRadioGroup, type RadioGroupProps, useNamespace } from 'element-plus'
import { type Component, type FunctionalComponent, h } from 'vue'

const useRadioStyle = () => {
    const radioNs = useNamespace('radio')
    return css`
        & .${radioNs.be('button', 'inner')} {
            padding: 3px 5px;
        }
    `
}

const RADIO_CLS = useRadioStyle()

type Option = {
    value: string
    icon: Component
}

type Props = ModelValue<string> & Pick<RadioGroupProps, 'size'> & {
    iconSize?: number
    options: Option[]
}

const IconRadioGroup: FunctionalComponent<Props> = ({ size, modelValue, onChange, options, iconSize = 15 }) => (
    <ElRadioGroup
        size={size}
        modelValue={modelValue}
        onChange={val => onChange?.(val as string)}
    >
        {options.map(({ value, icon }) => (
            <ElRadioButton value={value} class={RADIO_CLS} >
                <ElIcon size={iconSize}>{h(icon)}</ElIcon>
            </ElRadioButton>
        ))}
    </ElRadioGroup>
)

IconRadioGroup.displayName = 'IconRadioGroup'

export default IconRadioGroup