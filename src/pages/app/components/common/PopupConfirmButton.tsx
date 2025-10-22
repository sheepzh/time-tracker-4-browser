/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { t } from "@app/locale"
import { type ButtonType, ElButton, ElPopconfirm } from "element-plus"
import type { Component, CSSProperties, FunctionalComponent } from "vue"

type Props = {
    confirmText?: string
    buttonText?: string
    text?: boolean
    buttonType?: ButtonType
    buttonIcon?: Component
    buttonStyle?: CSSProperties
    onConfirm?: () => void
}

const PopupConfirmButton: FunctionalComponent<Props> = props => (
    <ElPopconfirm
        confirmButtonText={t(msg => msg.button.okey)}
        cancelButtonText={t(msg => msg.button.dont)}
        title={props.confirmText}
        width={300}
        onConfirm={props.onConfirm}
        v-slots={{
            reference: () => (
                <ElButton
                    size="small"
                    text={props.text}
                    type={props.buttonType}
                    icon={props.buttonIcon}
                    style={props.buttonStyle}
                >
                    {props.buttonText}
                </ElButton>
            )
        }}
    />
)

PopupConfirmButton.displayName = "PopupConfirmButton"

export default PopupConfirmButton
