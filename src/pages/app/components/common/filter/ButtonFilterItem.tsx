/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { type I18nKey, t } from '@app/locale'
import { type ButtonProps, ElButton } from "element-plus"
import { defineComponent } from "vue"

type Props = {
    icon: ButtonProps['icon']
    text: I18nKey
    type?: ButtonProps['type']
    onClick?: NoArgCallback
}

const ButtonFilterItem = defineComponent<Props>(props => {
    return () => (
        <ElButton type={props.type ?? 'primary'} icon={props.icon} onClick={props.onClick}>
            {t(props.text)}
        </ElButton>
    )
}, { props: ['icon', 'onClick', 'text', 'type'] })

export default ButtonFilterItem