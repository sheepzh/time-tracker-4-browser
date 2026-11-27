import { type StatDay } from '@/shared/day'
import { listSiteStats } from "@api/sw/stat"
import { initDayOffset, useRequest } from "@hooks"
import { DataLock, Flex } from '@pages/components'
import { cvt2LocaleDate } from '@pages/util/time'
import { ElText } from "element-plus"
import { defineComponent } from "vue"
import RowList from "./components/RowList"
import Search from "./components/Search"
import { t } from "./locale"

const _default = defineComponent<{}>(() => {
    const today = initDayOffset()
    const { data, refresh, loading } = useRequest(async (query: string, day: StatDay) => {
        const date = day.toString()
        const list = await listSiteStats({ date, query, sortKey: 'focus', sortDirection: 'DESC', remote: false })
        return { list, day }
    }, { defaultParam: ['', today.value] })

    return () => <DataLock>
        <Flex column height='100%'>
            <Search onSearch={refresh} />
            <Flex height={60} style={{ paddingInlineStart: '5px' }}>
                <ElText>
                    {t(msg => msg.list.title)}
                </ElText>
                &emsp;
                <ElText size="small">
                    @{cvt2LocaleDate(data.value?.day)}
                </ElText>
            </Flex>
            <RowList loading={loading.value} data={data.value?.list ?? []} />
        </Flex>
    </DataLock>
})

export default _default