import { selectSite } from "@api/sw/stat"
import { useRequest } from "@hooks/useRequest"
import Flex from '@pages/components/Flex'
import { formatTime, formatTimeYMD } from "@util/time"
import { ElText } from "element-plus"
import { defineComponent, ref } from "vue"
import RowList from "./components/RowList"
import Search from "./components/Search"
import { t } from "./locale"

const _default = defineComponent<{}>(() => {
    const date = ref(new Date())
    const query = ref('')

    const { data, refresh, loading } = useRequest(() => selectSite({
        date: formatTimeYMD(date.value),
        query: query.value,
        sortKey: 'focus',
        sortDirection: 'DESC',
    }), { defaultValue: [] })

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
        <Flex height={60} style={{ paddingInlineStart: '5px' }}>
            <ElText>
                {t(msg => msg.list.title)}
            </ElText>
            &emsp;
            <ElText size="small">
                @{formatTime(date.value, t(msg => msg.calendar.dateFormat))}
            </ElText>
        </Flex>
        <RowList loading={loading.value} data={data.value} />
    </Flex>
})

export default _default