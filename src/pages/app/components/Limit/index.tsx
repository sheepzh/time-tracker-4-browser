/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { useXsState } from '@hooks'
import { defineComponent } from "vue"
import ContentCard from '../common/ContentCard'
import ContentContainer from "../common/ContentContainer"
import { Filter, List, Modify, Table, Test } from "./components"
import { useLimitProvider } from "./context"

const _default = defineComponent(() => {
    const { modifyInst, testInst } = useLimitProvider()
    const isXs = useXsState()

    return () => (
        <ContentContainer v-slots={{
            filter: () => <Filter />,
            default: () => <>
                {isXs.value ? <List /> : <ContentCard><Table /></ContentCard>}
                <Modify ref={modifyInst} />
                <Test ref={testInst} />
            </>
        }} />
    )
})

export default _default
