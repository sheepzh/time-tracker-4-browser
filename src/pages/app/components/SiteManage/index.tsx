/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { useXsState } from '@hooks'
import { defineComponent } from "vue"
import ContentContainer from '../common/ContentContainer'
import { initSiteManage } from './context'
import Filter from "./Filter"
import List from './List'
import Modify from './Modify'
import Table from "./Table"

export default defineComponent(() => {
    const { modifyInst, comp } = initSiteManage()
    const isXs = useXsState()

    return () => <ContentContainer v-slots={{
        filter: () => <Filter />,
        default: () => <>
            {isXs.value ? <List ref={comp} /> : <Table ref={comp} />}
            <Modify ref={modifyInst} onSave={() => comp.value?.refresh()} />
        </>,
    }} />
})
