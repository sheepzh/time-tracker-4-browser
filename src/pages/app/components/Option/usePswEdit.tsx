/**
 * Copyright (c) 2023-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { t } from '@app/locale'
import { css } from '@emotion/css'
import { useState } from '@hooks'
import { ElForm, ElFormItem, ElInput, ElMessage, ElMessageBox, useNamespace } from "element-plus"

export const usePswEdit = () => {
    const [psw, setPsw, resetPsw] = useState<string>()
    const [confirmPsw, setConfirmPsw, resetConfirmPsw] = useState<string>()

    const messageBoxNs = useNamespace('message-box')
    const customClass = css`
        & .${messageBoxNs.e('container')} {
            padding: 15px 10px;

            .${messageBoxNs.e('status')} {
                display: none;
            }
            .${messageBoxNs.e('message')} {
                flex: 1;
            }
        }
    `

    const editPsw = async (): Promise<string | undefined> => {
        resetPsw()
        resetConfirmPsw()

        const action = await ElMessageBox({
            message: (
                <ElForm labelWidth={120} labelPosition="left">
                    <ElFormItem required label={t(msg => msg.option.psw.label)}>
                        <ElInput modelValue={psw.value} onInput={setPsw} type='password' />
                    </ElFormItem>
                    <ElFormItem required label={t(msg => msg.option.psw.labelAgain)}>
                        <ElInput modelValue={confirmPsw.value} onInput={setConfirmPsw} type='password' />
                    </ElFormItem>
                </ElForm>
            ),
            customClass,
            confirmButtonText: t(msg => msg.button.confirm),
            showCancelButton: true,
            cancelButtonText: t(msg => msg.button.cancel),
            closeOnClickModal: false,
            beforeClose(action, _instance, done) {
                if (action !== 'confirm') return done()
                if (!psw.value) {
                    return ElMessage.error("No password filled in")
                } else if (!confirmPsw.value) {
                    return ElMessage.error("Please re-enter the password")
                } else if (psw.value !== confirmPsw.value) {
                    return ElMessage.error("The two passwords you entered are different")
                }
                done()
            },
        }).catch(() => undefined)
        return action === "confirm" ? psw.value : undefined
    }
    return editPsw
}
