import { t } from '@i18n'
import messages from '@i18n/message/common/operation'
import { type ButtonProps, ElButton, ElMessageBox, ElPopconfirm } from 'element-plus'
import { type FunctionalComponent } from 'vue'

type Props = {
    type?: 'popover' | 'message-box'
    buttonText: string
    buttonProps: ButtonProps
    visible?: boolean
    onConfirm?: NoArgCallback
}

const ConfirmButton: FunctionalComponent<Props> = props => {
    const { type = 'popover', onConfirm, visible = true, buttonText, buttonProps } = props
    if (!visible) return null

    if (type === 'message-box') {
        const handleClick = () => ElMessageBox.confirm(t(messages, { key: msg => msg.confirmMsg }), {
            dangerouslyUseHTMLString: true,
            confirmButtonText: buttonText,
            confirmButtonType: buttonProps.type,
        }).then(onConfirm).catch(() => { })

        return (
            <ElButton {...buttonProps} onClick={handleClick}>
                {buttonText}
            </ElButton>
        )
    }

    return () => (
        <ElPopconfirm
            title={t(messages, { key: msg => msg.confirmMsg })}
            onConfirm={onConfirm}
            confirmButtonText={buttonText}
            confirmButtonType={buttonProps.type}
            v-slots={{
                reference: () => (
                    <ElButton {...buttonProps}>
                        {buttonText}
                    </ElButton>
                ),
            }}
        />
    )
}

export default ConfirmButton