import { sendMsg2Runtime } from '@api/sw/common'
import { t } from '@app/locale'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ref } from 'vue'
import Form, { type FormInstance } from './Form'

export const use2faSetup = () => {
    const form = ref<FormInstance>()

    const setup2fa = async () => {
        const otpauth = await sendMsg2Runtime('meta.prepare2fa')

        const action = await ElMessageBox({
            title: t(msg => msg.option.limit.level.twoFaTitle),
            message: () => <Form ref={form} otpauth={otpauth} />,
            confirmButtonText: t(msg => msg.button.confirm),
            showCancelButton: true,
            closeOnClickModal: false,
            showClose: false,
            customStyle: { '--el-messagebox-padding-primary': '12px 20px' },
            beforeClose: (act, instance, done) => {
                if (act !== 'confirm') return done()

                const code = form.value?.getVerifyCode().replace(/\s/g, '')
                if (!code) return ElMessage.error('Verify code is empty')
                if (!/^\d{6}$/.test(code)) return ElMessage.error('Invalid verify code')

                sendMsg2Runtime('meta.check2fa', code).then(ok => {
                    if (!ok) return ElMessage.error("Incorrect code")
                    instance.action = act
                    instance.inputValue = code
                    done()
                }).catch(() => ElMessage.error("Failed to check code"))
            },
        })

        if (action !== 'confirm') throw new Error('User cancelled')
    }

    return { setup2fa }
}
