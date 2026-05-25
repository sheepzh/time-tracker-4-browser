/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { listWhitelist, saveWhitelist } from '@api/sw/whitelist'
import { useDocumentVisibility, useManualRequest, useRequest } from '@hooks'
import CondEditor from '@pages/components/CondEditor'
import { defineComponent } from "vue"
import AlertBox from './AlertBox'

const PLACEHOLDER = 'e.g. github.com, +github.com/sheepzh/**, *.youtube.com, __local_pdf__'

const Whitelist = defineComponent<{}>(() => {
    const docVisible = useDocumentVisibility()
    const { data, refresh } = useRequest(listWhitelist, { defaultValue: [], deps: [docVisible] })
    const { refresh: handleChange } = useManualRequest(saveWhitelist, { onSuccess: refresh })

    return () => (
        <AlertBox
            title={msg => msg.rule.white.infoAlertTitle}
            lines={[
                msg => msg.rule.white.infoAlert0,
                msg => msg.rule.white.infoAlert1,
                msg => msg.rule.white.infoAlert2,
            ]}
        >
            <CondEditor modelValue={data.value} onChange={handleChange} placeholder={PLACEHOLDER} />
        </AlertBox>
    )
})

export default Whitelist
