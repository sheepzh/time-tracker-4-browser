/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { useDialogSop } from '@app/components/common/DialogSop/context'
import CompareTable from "@app/components/common/imported/CompareTable"
import ResolutionRadio from "@app/components/common/imported/ResolutionRadio"
import Flex from "@pages/components/Flex"
import { defineComponent } from "vue"
import type { ImportForm } from './types'

const _default = defineComponent<{}>((props, ctx) => {
    const { form } = useDialogSop<ImportForm>()

    return () => (
        <Flex column width="100%" gap={20}>
            <CompareTable data={form.data} comparedCol={msg => msg.dataManage.importOther.imported} />
            <Flex width="100%" justify="center">
                <ResolutionRadio modelValue={form.resolution} onChange={v => form.resolution = v} />
            </Flex>
        </Flex>
    )
})

export default _default
