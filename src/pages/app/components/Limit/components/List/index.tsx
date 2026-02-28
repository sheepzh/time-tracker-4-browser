/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import Flex from '@pages/components/Flex'
import { ElScrollbar } from 'element-plus'
import { defineComponent } from "vue"
import { useLimitTable } from "../../context"
import Card from "./Card"

const _default = defineComponent(() => {
    const { list } = useLimitTable()

    return () => (
        <ElScrollbar>
            <Flex
                column padding={8} gap={15} height="100%"
                style={{ overflow: 'auto' }}
            >
                {list.value.map(row => <Card key={row.id} value={row} />)}
            </Flex>
        </ElScrollbar>
    )
})

export default _default
