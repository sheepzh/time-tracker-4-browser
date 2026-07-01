import { t, tWith } from '@app/locale'
import { ElMessageBox } from 'element-plus'

export const confirmReload = (locale?: tt4b.Locale) => ElMessageBox({
    message: locale ? tWith(msg => msg.option.applyConfirm, locale) : t(msg => msg.option.applyConfirm),
    type: "success",
    confirmButtonText: locale ? tWith(msg => msg.option.button.reload, locale) : t(msg => msg.option.button.reload),
    closeOnPressEscape: false,
    closeOnClickModal: false
}).then(() => { location.reload?.() }).catch(() => {/* do nothing */ })