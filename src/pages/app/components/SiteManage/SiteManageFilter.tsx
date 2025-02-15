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
import { useState } from "@hooks"
import Flex from "@pages/components/Flex"
import { computed, defineComponent, type PropType, watch } from "vue"
import DropdownButton, { type DropdownButtonItem } from "../common/DropdownButton"
import CategoryFilter from "../common/filter/CategoryFilter"
import MultiSelectFilterItem from "../common/filter/MultiSelectFilterItem"
import { ALL_TYPES } from "./common"

export type FilterOption = {
    host?: string,
    alias?: string,
    types?: timer.site.Type[],
    cateIds?: number[],
}

type BatchOpt = 'change' | 'disassociate' | 'delete'

const _default = defineComponent({
    props: {
        defaultValue: Object as PropType<FilterOption>,
    },
    emits: {
        change: (_option: FilterOption) => true,
        create: () => true,
        batchDelete: () => true,
        batchChangeCate: () => true,
        batchDisassociate: () => true,
    },
    setup(props, ctx) {
        const { categories } = useCategories()

        const defaultOption = props.defaultValue
        const [host, setHost] = useState(defaultOption?.host)
        const [alias, setAlias] = useState(defaultOption?.alias)
        const [types, setTypes] = useState(defaultOption?.types)

        const cateDisabled = computed(() => !!types.value?.length && !types.value?.includes?.('normal'))
        watch([cateDisabled], () => cateDisabled.value && setCateIds([]))

        const [cateIds, setCateIds] = useState(defaultOption?.cateIds)

        watch(categories, () => {
            const allCateIds = categories.value?.map(c => c.id) || []
            const newVal = cateIds.value?.filter(cid => allCateIds.includes(cid))
            // If selected category is deleted, then reset the value
            newVal?.length !== cateIds.value?.length && setCateIds(newVal)
        })

        watch([host, alias, types, cateIds], () => ctx.emit("change", {
            host: host.value,
            alias: alias.value,
            types: types.value,
            cateIds: cateIds.value,
        }))

        const items: DropdownButtonItem<BatchOpt>[] = [{
            key: 'change',
            label: t(msg => msg.siteManage.cate.batchChange),
            icon: Grid,
        }, {
            key: 'disassociate',
            label: t(msg => msg.siteManage.cate.batchDisassociate),
            icon: Connection,
        }, {
            key: 'delete',
            label: t(msg => msg.button.batchDelete),
            icon: Delete,
        }]

        const handleBatchClick = (key: BatchOpt) => {
            if (key === 'change') {
                ctx.emit('batchChangeCate')
            } else if (key === 'disassociate') {
                ctx.emit('batchDisassociate')
            } else if (key === 'delete') {
                ctx.emit('batchDelete')
            }
        }

        return () => (
            <Flex gap={10} justify="space-between">
                <Flex gap={10}>
                    <InputFilterItem
                        placeholder={t(msg => msg.siteManage.hostPlaceholder)}
                        onSearch={setHost}
                    />
                    <InputFilterItem
                        placeholder={t(msg => msg.siteManage.aliasPlaceholder)}
                        onSearch={setAlias}
                    />
                    <MultiSelectFilterItem
                        placeholder={t(msg => msg.siteManage.column.type)}
                        options={ALL_TYPES.map(type => ({ value: type, label: t(msg => msg.siteManage.type[type].name) }))}
                        defaultValue={types.value}
                        onChange={setTypes}
                    />
                    <CategoryFilter
                        disabled={cateDisabled.value}
                        modelValue={cateIds.value}
                        onChange={setCateIds}
                    />
                </Flex>
                <Flex gap={10}>
                    <DropdownButton items={items} onClick={handleBatchClick} />
                    <ButtonFilterItem
                        text={t(msg => msg.button.create)}
                        icon={<Plus />}
                        type="success"
                        onClick={() => ctx.emit("create")}
                    />
                </Flex>
            </Flex>
        )
    }
})

export default _default