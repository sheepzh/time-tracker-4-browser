/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import ButtonFilterItem from "@app/components/common/filter/ButtonFilterItem"
import InputFilterItem from "@app/components/common/filter/InputFilterItem"
import { useCategories } from "@app/context"
import { t } from "@app/locale"
import { Connection, Delete, Grid, Plus } from "@element-plus/icons-vue"
import Flex from "@pages/components/Flex"
import { computed, defineComponent, watch } from "vue"
import DropdownButton, { type DropdownButtonItem } from "../common/DropdownButton"
import CategoryFilter from "../common/filter/CategoryFilter"
import MultiSelectFilterItem from "../common/filter/MultiSelectFilterItem"
import { ALL_TYPES } from "./common"
import { useSiteManageFilter } from './useSiteManage'

type BatchOpt = 'change' | 'disassociate' | 'delete'

const _default = defineComponent<{
    onCreate: NoArgCallback
    onBatchChangeCate: NoArgCallback
    onBatchDisassociate: NoArgCallback
    onBatchDelete: NoArgCallback
}>(props => {
    const { categories } = useCategories()
    const filter = useSiteManageFilter()

    const cateDisabled = computed(() => {
        const types = filter.types
        return !!types?.length && !types?.includes?.('normal')
    })
    watch(cateDisabled, () => cateDisabled.value && (filter.cateIds = []))

    watch(categories, () => {
        const allCateIds = categories.value?.map(c => c.id) || []
        const newVal = filter.cateIds?.filter(cid => allCateIds.includes(cid))
        // If selected category is deleted, then reset the value
        newVal?.length !== filter.cateIds?.length && (filter.cateIds = newVal)
    })

    const items: DropdownButtonItem<BatchOpt>[] = [{
        key: 'change',
        label: t(msg => msg.siteManage.cate.batchChange),
        icon: Grid,
        onClick: props.onBatchChangeCate,
    }, {
        key: 'disassociate',
        label: t(msg => msg.siteManage.cate.batchDisassociate),
        icon: Connection,
        onClick: props.onBatchDisassociate,
    }, {
        key: 'delete',
        label: t(msg => msg.button.batchDelete),
        icon: Delete,
        onClick: props.onBatchDelete,
    }]

    return () => (
        <Flex gap={10} justify="space-between">
            <Flex gap={10}>
                <InputFilterItem
                    placeholder={`${t(msg => msg.item.host)} / ${t(msg => msg.siteManage.column.alias)}`}
                    onSearch={val => filter.query = val}
                    width={200}
                />
                <MultiSelectFilterItem
                    placeholder={t(msg => msg.siteManage.column.type)}
                    options={ALL_TYPES.map(type => ({ value: type, label: t(msg => msg.siteManage.type[type].name) }))}
                    defaultValue={filter.types}
                    onChange={val => filter.types = val as timer.site.Type[]}
                />
                <CategoryFilter
                    disabled={cateDisabled.value}
                    modelValue={filter.cateIds}
                    onChange={v => filter.cateIds = v}
                />
            </Flex>
            <Flex gap={10}>
                <DropdownButton items={items} />
                <ButtonFilterItem
                    text={t(msg => msg.button.create)}
                    icon={Plus}
                    type="success"
                    onClick={props.onCreate}
                />
            </Flex>
        </Flex>
    )
})

export default _default