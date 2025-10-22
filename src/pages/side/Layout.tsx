import { css } from '@emotion/css'
import { useRequest } from "@hooks"
import Flex from '@pages/components/Flex'
import statService from "@service/stat-service"
import { formatTime } from "@util/time"
import { ElText, useNamespace } from "element-plus"
import { defineComponent, ref } from "vue"
import RowList from "./components/RowList"
import Search from "./components/Search"
import { t } from "./locale"

const _default = defineComponent(() => {
    const date = ref(new Date())
    const query = ref('')

    const textNs = useNamespace('text')
    const titleClz = css`
        padding-inline-start: 5px;
        .${textNs.b()} {
            display: flex;
            align-items: center;
            height: 100%;
        }
    `

    const { data, refresh, loading } = useRequest(() => {
        return statService.selectSite({
            date: date.value ?? new Date(),
            query: query.value,
            sortKey: 'focus',
            sortDirection: 'DESC',
        })
    })

    return () => <Flex column height='100%'>
        <Search
            defaultQuery={query.value}
            defaultDate={date.value}
            onSearch={(newQuery, newDate) => {
                query.value = newQuery
                date.value = newDate
                // Force refresh
                refresh()
            }}
        />
        <Flex class={titleClz} height={60}>
            <ElText>
                {t(msg => msg.list.title)}
            </ElText>
            &emsp;
            <ElText size="small">
                @{formatTime(date.value, t(msg => msg.calendar.dateFormat))}
            </ElText>
        </Flex>
        <RowList
            loading={loading.value}
            data={data.value ?? []}
            style={{ flex: 1, overflow: "auto" }}
        />
    </Flex>
})

export default _default