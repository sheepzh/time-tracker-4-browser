import { t } from "@app/locale"
import { css } from "@emotion/css"
import { useState } from "@hooks"
import { ElForm, ElFormItem, ElInput, ElMessage, ElMessageBox, useNamespace } from "element-plus"

type Options = {
    reset: () => string | undefined
}

const useCustomClass = () => {
    const ns = useNamespace('message-box')
    return css`
        .${ns.e('container')} {
            .${ns.e('message')} {
                flex: 1;
            }
        }
    `
}

export const usePswEdit = (options: Options) => {
    const { reset } = options || {}

    const [psw, setPsw] = useState(reset?.())
    const [confirmPsw, setConfirmPsw, resetConfirmPsw] = useState('')
    const customClass = useCustomClass()

    const modifyPsw = async (): Promise<string | undefined> => {
        setPsw('')
        resetConfirmPsw()

        const action = await ElMessageBox({
            title: t(msg => msg.option.dailyLimit.level.passwordLabel, { input: '' }),
            message: (
                <ElForm labelWidth={120} labelPosition="left">
                    <ElFormItem required label={t(msg => msg.option.dailyLimit.level.pswFormLabel)}>
                        <ElInput modelValue={psw.value} onInput={setPsw} />
                    </ElFormItem>
                    <ElFormItem required label={t(msg => msg.option.dailyLimit.level.pswFormAgain)}>
                        <ElInput modelValue={confirmPsw.value} onInput={setConfirmPsw} />
                    </ElFormItem>
                </ElForm>
            ),
            customClass,
            confirmButtonText: t(msg => msg.button.confirm),
            showCancelButton: true,
            cancelButtonText: t(msg => msg.button.cancel),
            closeOnClickModal: false,
            beforeClose(action, instance, done) {
                if (action === 'confirm') {
                    // check input
                    if (!psw.value) {
                        return ElMessage.error("No password filled in")
                    } else if (!confirmPsw.value) {
                        return ElMessage.error("Please re-enter the password")
                    } else if (psw.value !== confirmPsw.value) {
                        return ElMessage.error("The two passwords you entered are different")
                    } else {
                        instance.action = action
                        instance.inputValue = psw.value
                    }
                }
                done()
            },
        })
        if (action !== 'confirm') {
            ElMessage.warning("Unknown action: " + action)
            throw "Ignore this message"
        }
        return psw.value
    }
    return { modifyPsw }
}