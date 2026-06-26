import { t } from '@i18n'
import messages from '@i18n/message/common/operation'
import { type ButtonProps, ElButton, ElMessageBox, ElPopconfirm } from 'element-plus'
import type { CSSProperties, FunctionalComponent } from 'vue'

type Props = {
    type?: 'popover' | 'message-box'
    style?: CSSProperties
    confirmText?: string
    buttonText?: string
    buttonProps: ButtonProps
    visible?: boolean
    onConfirm?: NoArgCallback
}

const ConfirmButton: FunctionalComponent<Props> = (props, { attrs }) => {
    const { visible = true } = props
    if (!visible) return null

    const {
        type = 'popover',
        onConfirm,
        buttonText = '', buttonProps,
        confirmText = t(messages, { key: msg => msg.confirmMsg }),
    } = props
    if (type === 'message-box') {
        const handleClick = () => ElMessageBox.confirm(confirmText, {
            confirmButtonText: buttonText,
            confirmButtonType: buttonProps.type,
        }).then(onConfirm).catch(() => { })

        return (
            <ElButton style={props.style} {...attrs} {...buttonProps} onClick={handleClick}>
                {buttonText}
            </ElButton>
        )
    }

    return (
        <ElPopconfirm
            title={confirmText}
            onConfirm={onConfirm}
            confirmButtonText={buttonText}
            confirmButtonType={buttonProps.type}
            v-slots={{
                reference: () => (
                    <ElButton style={props.style} {...attrs} {...buttonProps}>
                        {buttonText}
                    </ElButton>
                ),
            }}
        />
    )
}

export default ConfirmButton