/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import type { SopStepInstance } from "@app/components/common/DialogSop"
import CompareTable from "@app/components/common/imported/CompareTable"
import ResolutionRadio from "@app/components/common/imported/ResolutionRadio"
import { t } from "@app/locale"
import { useState } from "@hooks"
import Flex from "@pages/components/Flex"
import { ElAlert } from "element-plus"
import { defineComponent } from "vue"

type Props = {
    data: timer.imported.Data
    clientName: string
}

const _default = defineComponent<Props>((props, ctx) => {
    const [resolution, setResolution] = useState<timer.imported.ConflictResolution>()

    ctx.expose({ parseData: () => resolution.value } satisfies SopStepInstance<timer.imported.ConflictResolution | undefined>)

    return () => (
        <Flex column width='100%' gap={20} margin='40px 20px 0 20px'>
            <ElAlert type="success" closable={false}>
                {
                    t(msg => msg.option.backup.download.confirmTip, {
                        clientName: props.clientName,
                        size: props.data?.rows?.length || 0
                    })
                }
            </ElAlert>
            <CompareTable data={props.data} comparedCol={msg => msg.option.backup.download.willDownload} />
            <Flex justify="center">
                <ResolutionRadio modelValue={resolution.value} onChange={setResolution} />
            </Flex>
        </Flex>
    )
}, { props: ['data', 'clientName'] })

export default _default
