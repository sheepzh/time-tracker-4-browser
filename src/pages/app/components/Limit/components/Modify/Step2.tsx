/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { useDialogSop } from '@app/components/common/DialogSop/context'
import type { ModifyForm } from '@app/components/Limit/types'
import { t } from '@app/locale'
import CondEditor, { type CondEditorInstance } from '@pages/components/CondEditor'
import Flex from "@pages/components/Flex"
import { defineComponent, onUpdated, ref } from "vue"

const _default = defineComponent(() => {
    const { form: data } = useDialogSop<ModifyForm>()
    const editor = ref<CondEditorInstance>()
    onUpdated(() => editor.value?.focus())

    return () => (
        <Flex column width="100%">
            <CondEditor
                ref={editor}
                modelValue={data.cond}
                onChange={l => data.cond = l}
                placeholder='e.g. www.demo.com, *.demo.com, demo.com/blog/*, demo.com/**, +www.demo.com/blog/list'
                tip={t(msg => msg.limit.wildcardTip)}
            />
        </Flex>
    )
})

export default _default
