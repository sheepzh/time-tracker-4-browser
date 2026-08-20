/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import ScrollList from '@app/components/common/ScrollList'
import { useLimitData } from "@app/components/Limit/context"
import { defineComponent } from "vue"
import Card from "./Card"

const _default = defineComponent<{}>(() => {
    const { list } = useLimitData()

    return () => (
        <ScrollList>
            {list.value.map(row => <Card key={row.id} value={row} />)}
        </ScrollList>
    )
})

export default _default
