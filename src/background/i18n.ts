import { t as _t, type I18nKey as _I18nKey } from "@i18n"
import messages, { type BgMessage } from "@i18n/message/bg"

export type I18nKey = _I18nKey<BgMessage>

export function t(key: I18nKey, param?: any) {
    const props = { key, param }
    return _t<BgMessage>(messages, props)
}
