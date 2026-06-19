/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import Category from '@app/components/common/Category'
import { ButtonFilter, CategoryFilter, InputFilter, MultiSelectFilter, } from '@app/components/common/filter'
import { useCategory } from "@app/context"
import { t } from '@app/locale'
import { Check, Close, Connection, Delete, Grid, Plus } from "@element-plus/icons-vue"
import Flex from "@pages/components/Flex"
import { ElButton, ElDialog, ElForm, ElFormItem } from 'element-plus'
import { computed, defineComponent, watch } from "vue"
import DropdownButton, { type DropdownButtonItem } from '../../common/DropdownButton'
import { ALL_TYPES } from "../common"
import { useSiteManageFilter } from '../context'
import { useBatch } from './useBatch'

type BatchOpt = 'change' | 'disassociate' | 'delete'

const Filter = defineComponent<{}>(() => {
    const cate = useCategory()
    const { filter, modifyInst } = useSiteManageFilter()
    const {
        batchChange, batchDisassociate, batchDelete,
        selectVisible, closeSelect, targetCate,
        onCateChangeConfirm,
    } = useBatch()

    const cateDisabled = computed(() => {
        const types = filter.types
        return !!types?.length && !types?.includes?.('normal')
    })
    watch(cateDisabled, () => cateDisabled.value && (filter.cateIds = []))

    watch(cate.all, () => {
        const allCateIds = cate.all.map(c => c.id)
        const newVal = filter.cateIds?.filter(cid => allCateIds.includes(cid))
        // If selected category is deleted, then reset the value
        newVal?.length !== filter.cateIds?.length && (filter.cateIds = newVal)
    })

    const items: DropdownButtonItem<BatchOpt>[] = [{
        key: 'change',
        label: t(msg => msg.siteManage.cate.batchChange),
        icon: Grid,
        onClick: batchChange,
    }, {
        key: 'disassociate',
        label: t(msg => msg.siteManage.cate.batchDisassociate),
        icon: Connection,
        onClick: batchDisassociate,
    }, {
        key: 'delete',
        label: t(msg => msg.button.batchDelete),
        icon: Delete,
        onClick: batchDelete,
    }]

    return () => (
        <Flex gap={10} justify="space-between" wrap>
            <Flex gap={10} wrap>
                <InputFilter
                    placeholder={`${t(msg => msg.item.host)} / ${t(msg => msg.siteManage.column.alias)}`}
                    onSearch={val => filter.query = val}
                    width={200}
                />
                <MultiSelectFilter
                    placeholder={t(msg => msg.siteManage.column.type)}
                    options={ALL_TYPES.map(type => ({ value: type, label: t(msg => msg.siteManage.type[type].name) }))}
                    modelValue={filter.types ?? []}
                    onChange={val => filter.types = val as tt4b.site.Type[]}
                />
                <CategoryFilter
                    disabled={cateDisabled.value}
                    modelValue={filter.cateIds}
                    onChange={v => filter.cateIds = v}
                />
            </Flex>
            <Flex gap={10}>
                <DropdownButton items={items} />
                <ButtonFilter
                    text={msg => msg.button.create}
                    icon={Plus}
                    type="success"
                    onClick={() => modifyInst.value?.add()}
                />
            </Flex>
            <ElDialog
                title={t(msg => msg.siteManage.cate.batchChange)}
                width={300}
                modelValue={selectVisible.value}
                onClose={closeSelect}
                v-slots={{
                    default: () => <>
                        <ElForm>
                            <ElFormItem label={t(msg => msg.siteManage.cate.name)} required>
                                <Category.Select modelValue={targetCate.value} onChange={value => targetCate.value = value} />
                            </ElFormItem>
                        </ElForm>
                    </>,
                    footer: () => <>
                        <Flex justify="end" gap={12}>
                            <ElButton icon={Close} type="info" onClick={closeSelect}>
                                {t(msg => msg.button.cancel)}
                            </ElButton>
                            <ElButton icon={Check} type="primary" onClick={onCateChangeConfirm}>
                                {t(msg => msg.button.confirm)}
                            </ElButton>
                        </Flex>
                    </>
                }}
            />
        </Flex>
    )
})

export default Filter