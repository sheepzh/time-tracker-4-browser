/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { type SopStepInstance } from "@app/components/common/DialogSop"
import CompareTable from "@app/components/common/imported/CompareTable"
import ResolutionRadio from "@app/components/common/imported/ResolutionRadio"
import { useState } from "@hooks"
import Flex from "@pages/components/Flex"
import { defineComponent } from "vue"

const _default = defineComponent<{ data: timer.imported.Data }>((props, ctx) => {
    const [resolution, setResolution] = useState<timer.imported.ConflictResolution>()

    ctx.expose({
        parseData: () => resolution.value
    } satisfies SopStepInstance<timer.imported.ConflictResolution | undefined>)

    return () => (
        <Flex column width="100%" gap={20}>
            <CompareTable data={props.data} comparedCol={msg => msg.dataManage.importOther.imported} />
            <Flex width="100%" justify="center">
                <ResolutionRadio modelValue={resolution.value} onChange={setResolution} />
            </Flex>
        </Flex>
    )
}, { props: ['data'] })

export default _default
