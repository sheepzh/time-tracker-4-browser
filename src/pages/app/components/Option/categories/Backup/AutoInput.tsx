/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { t, tN } from "@app/locale"
import { locale } from "@i18n"
import localeMessages from "@i18n/message/common/locale"
import { ElInputNumber, ElSwitch } from "element-plus"
import { defineComponent } from "vue"

type Props = {
    autoBackup: boolean
    interval: number | undefined
    onAutoBackupChange: (val: boolean) => void
    onIntervalChange: (val: number | undefined) => void
}

const _default = defineComponent<Props>(props => {
    return () => <>
        <ElSwitch modelValue={props.autoBackup} onChange={val => props.onAutoBackupChange?.(!!val)} />
        {' ' + t(msg => msg.option.backup.auto.label)}
        {!!props.autoBackup && <>
            {localeMessages[locale].comma || ' '}
            {tN(msg => msg.option.backup.auto.interval, {
                input: <ElInputNumber
                    min={10}
                    size="small"
                    modelValue={props.interval}
                    onChange={props.onIntervalChange}
                />
            })}
        </>}
    </>
}, { props: ['autoBackup', 'interval', 'onAutoBackupChange', 'onIntervalChange'] })

export default _default