import { useRequest } from "@hooks"
import { OptionCheckbox, OptionPopover, type PopoverInstance } from '@popup/components/Option'
import { t } from '@popup/locale'
import { HEADER_OPTION_SLOT, TOOLBAR_SLOT } from '@popup/slot'
import { ElCol, ElRow, ElScrollbar } from "element-plus"
import { defineComponent, ref, Teleport, watch } from "vue"
import { initStatContext } from '../stat/context'
import StatToolbar from '../stat/StatToolbar'
import Item from "./Item"
import { doQuery } from "./query"

const Ranking = defineComponent(() => {
    const { option, query } = initStatContext()
    const { data: result } = useRequest(() => doQuery(query, option), { deps: () => ({ ...query, ...option }) })

    const popover = ref<PopoverInstance>()
    watch(() => option.showName, () => popover.value?.close())

    return () => <>
        <Teleport defer to={`#${TOOLBAR_SLOT}`}>
            <StatToolbar />
        </Teleport>
        <Teleport defer to={`#${HEADER_OPTION_SLOT}`}>
            <OptionPopover ref={popover}>
                <OptionCheckbox
                    label={t(msg => msg.header.showSiteName)}
                    modelValue={option.showName}
                    onChange={v => option.showName = v}
                />
            </OptionPopover>
        </Teleport>
        <ElScrollbar noresize style={{ width: '100%' }}>
            <ElRow gutter={10} style={{ rowGap: '10px' }}>
                {result.value?.rows?.map(row => (
                    <ElCol span={24 / 3}>
                        <Item
                            value={row}
                            max={result.value?.max}
                            total={result.value?.total}
                            date={result.value?.date}
                            displaySiteName={result.value?.displaySiteName}
                        />
                    </ElCol>
                ))}
            </ElRow>
        </ElScrollbar>
    </>
})

export default Ranking
