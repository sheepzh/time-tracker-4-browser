/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { type I18nKey, t } from '@app/locale'
import { useXsState } from '@hooks'
import { type ButtonProps, ElButton } from "element-plus"
import { defineComponent } from "vue"

type Props = Pick<ButtonProps, 'icon' | 'type'> & {
    text: I18nKey
    onClick?: NoArgCallback
}

const ButtonFilter = defineComponent<Props>(props => {
    const isXs = useXsState()
    return () => isXs.value
        ? (
            <ElButton
                circle
                size='small'
                type={props.type ?? 'primary'}
                icon={props.icon}
                onClick={props.onClick}
            />
        ) : (
            <ElButton type={props.type ?? 'primary'} icon={props.icon} onClick={props.onClick}>
                {t(props.text)}
            </ElButton>
        )
}, { props: ['icon', 'onClick', 'text', 'type'] })

export default ButtonFilter