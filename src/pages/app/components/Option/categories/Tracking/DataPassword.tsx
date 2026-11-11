import { t } from "@app/locale"
import { Edit } from "@element-plus/icons-vue"
import { t as t_ } from "@i18n"
import sharedMessages from "@i18n/message/common/shared"
import { releaseLock } from '@pages/components/DataLock'
import { ElButton, ElInput, ElMessage, ElMessageBox, ElSwitch } from "element-plus"
import { defineComponent } from "vue"
import { usePswEdit } from "../../usePswEdit"

const _default = defineComponent<ModelValue<string>>(props => {
    const editPsw = usePswEdit()

    // The current password must be verified before changing or disabling it
    const verifyCurrent = async (): Promise<boolean> => {
        if (!props.modelValue) return true
        return ElMessageBox({
            boxType: 'prompt',
            type: 'warning',
            autofocus: true,
            showCancelButton: true,
            showClose: false,
            showInput: true,
            closeOnClickModal: false,
            inputType: 'password',
            buttonSize: 'small',
            confirmButtonText: t(msg => msg.button.confirm),
            cancelButtonText: t(msg => msg.button.cancel),
            message: t(msg => msg.option.tracking.dataPswReset),
            beforeClose: (action, instance, done) => {
                if (action !== 'confirm') return done()
                if (instance.inputValue !== props.modelValue) {
                    return ElMessage.error(t_(sharedMessages, { key: msg => msg.incorrectPassword }))
                }
                done()
            },
        }).then(() => true).catch(() => false)
    }

    const applyPsw = async (): Promise<boolean> => {
        if (!(await verifyCurrent())) return false
        const psw = await editPsw()
        if (psw === undefined) return false
        props.onChange?.(psw)
        releaseLock()
        return true
    }

    const clearPsw = async (): Promise<boolean> => {
        if (!(await verifyCurrent())) return false
        props.onChange?.('')
        releaseLock()
        return true
    }

    const toggle = () => props.modelValue ? clearPsw() : applyPsw()

    return () => <>
        <ElSwitch modelValue={!!props.modelValue} beforeChange={toggle} />
        {' ' + t(msg => msg.option.tracking.dataPsw)}
        {!!props.modelValue && <ElInput
            modelValue={props.modelValue}
            size="small"
            type="password"
            readonly
            style={{ width: '200px' }}
            v-slots={{
                append: () => <ElButton icon={Edit} onClick={applyPsw} />,
            }}
        />}
    </>
}, { props: ['modelValue', 'onChange'] })

export default _default
