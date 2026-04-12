/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { useXsState } from '@hooks'
import { defineComponent } from "vue"
import ContentContainer from '../common/ContentContainer'
import { initReportContext } from "./context"
import Filter from "./Filter"
import List from "./List"
import Table from "./Table"

const _default = defineComponent(() => {
    const { comp } = initReportContext()
    const isXs = useXsState()

    return () => <ContentContainer v-slots={{
        filter: () => <Filter />,
        default: () => isXs.value ? <List ref={comp} /> : <Table ref={comp} />
    }} />
})

export default _default
