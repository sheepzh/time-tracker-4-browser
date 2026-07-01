/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { MediaSize, useMediaSize } from '@hooks'
import { ElScrollbar } from 'element-plus'
import { defineComponent, type StyleValue } from "vue"
import Select from "./Select"
import Tabs from "./Tabs"

const _default = defineComponent<{}>(() => {
    const mediaSize = useMediaSize()

    return () => (
        <ElScrollbar height="100%" style={{ width: '100%' } satisfies StyleValue}>
            {mediaSize.value <= MediaSize.sm ? <Select /> : <Tabs />}
        </ElScrollbar>
    )
})

export default _default