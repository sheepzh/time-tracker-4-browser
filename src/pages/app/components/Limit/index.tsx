/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import type { LimitQuery } from '@app/router/constants'
import { useXsState } from '@hooks'
import { defineComponent, onMounted } from "vue"
import { useRoute, useRouter } from 'vue-router'
import ContentCard from '../common/ContentCard'
import ContentContainer from '../common/ContentContainer'
import { Filter, List, Modify, Table, Test } from "./components"
import { useLimitProvider } from "./context"

const initialQuery = () => {
    const { url, action } = useRoute().query as LimitQuery
    useRouter().replace({ query: {} })
    return {
        url: url && decodeURIComponent(url),
        action,
    }
}

const _default = defineComponent(() => {
    const { url, action } = initialQuery()
    const initialUrl = action === 'create' ? undefined : url
    const { modifyInst, testInst, inst } = useLimitProvider(initialUrl)
    const isXs = useXsState()

    if (action === 'create') {
        onMounted(() => setTimeout(() => modifyInst.value?.create(url)))
    }

    return () => (
        <ContentContainer v-slots={{
            filter: () => <Filter />,
            default: () => <>
                {isXs.value ? <List /> : <ContentCard><Table ref={inst} /></ContentCard>}
                <Modify ref={modifyInst} />
                <Test ref={testInst} />
            </>
        }} />
    )
})

export default _default
