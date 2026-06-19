/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import Flex from "@pages/components/Flex"
import { defineComponent } from "vue"
import ContentContainer from '../common/ContentContainer'
import Pagination from '../common/Pagination'
import Filter from "./Filter"
import Modify from './Modify'
import Table from "./Table"
import { initSiteManage } from './context'

export default defineComponent(() => {
    const {
        page, pagination, refresh, loading, modifyInst, loadingTarget,
    } = initSiteManage()

    return () => <ContentContainer v-slots={{
        filter: () => <Filter />,
        content: () => <>
            <Flex ref={loadingTarget} column width="100%" height="100%" gap={23}>
                <Flex flex={1} height={0}>
                    <Table />
                </Flex>
                <Flex justify="center">
                    <Pagination
                        disabled={loading.value}
                        defaultValue={page}
                        total={pagination.value.total}
                        onChange={val => { page.num = val.num, page.size = val.size }}
                    />
                </Flex>
            </Flex>
            <Modify ref={modifyInst} onSave={refresh} />
        </>,
    }} />
})
