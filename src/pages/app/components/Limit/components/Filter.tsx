/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { createTabAfterCurrent } from "@api/chrome/tab"
import ButtonFilterItem from "@app/components/common/filter/ButtonFilterItem"
import InputFilterItem from "@app/components/common/filter/InputFilterItem"
import SwitchFilterItem from "@app/components/common/filter/SwitchFilterItem"
import { t } from "@app/locale"
import { OPTION_ROUTE } from "@app/router/constants"
import { Delete, Open, Operation, Plus, SetUp, TurnOff, WarningFilled } from "@element-plus/icons-vue"
import { useXsState } from '@hooks/useMediaSize'
import Flex from "@pages/components/Flex"
import { getAppPageUrl } from "@util/constant/url"
import { ElIcon, ElText, ElTooltip } from 'element-plus'
import { computed, defineComponent, ref, Ref, watch } from "vue"
import DropdownButton, { type DropdownButtonItem } from "../../common/DropdownButton"
import { useLimitAction, useLimitBatch, useLimitFilter } from "../context"

const optionPageUrl = getAppPageUrl(OPTION_ROUTE, { i: 'limit' })

type BatchOpt = 'delete' | 'enable' | 'disable'

const useCreateTip = (empty: Ref<boolean>, isXs: Ref<boolean>) => {
    const tipVisible = ref(false)
    let initialized = false
    watch(empty, emptyVal => {
        if (initialized || !emptyVal) return
        tipVisible.value = true
        initialized = true
        setTimeout(closeTip, 10000)
    })
    const closeTip = () => tipVisible.value = false
    const finalVisible = computed(() => !isXs.value && tipVisible.value)
    return { tipVisible: finalVisible, closeTip }
}

const _default = defineComponent(() => {
    const { create, test, empty } = useLimitAction()
    const isXs = useXsState()
    const { tipVisible, closeTip } = useCreateTip(empty, isXs)
    const filter = useLimitFilter()
    const { batchDelete, batchDisable, batchEnable } = useLimitBatch()

    const batchItems: DropdownButtonItem<BatchOpt>[] = [
        {
            key: 'delete',
            label: t(msg => msg.button.batchDelete),
            icon: Delete,
            onClick: batchDelete,
        }, {
            key: 'enable',
            label: t(msg => msg.button.batchEnable),
            icon: Open,
            onClick: batchEnable,
        }, {
            key: 'disable',
            label: t(msg => msg.button.batchDisable),
            icon: TurnOff,
            onClick: batchDisable,
        },
    ]

    const handleCreateClick = () => {
        closeTip()
        create()
    }

    return () => (
        <Flex justify="space-between" gap={10}>
            <Flex gap={10}>
                <InputFilterItem
                    defaultValue={filter.url}
                    placeholder={t(msg => msg.limit.item.condition)}
                    onSearch={val => filter.url = val}
                />
                <SwitchFilterItem
                    v-show={!isXs.value}
                    historyName="onlyEnabled"
                    label={t(msg => msg.limit.filterDisabled)}
                    defaultValue={filter.onlyEnabled}
                    onChange={val => filter.onlyEnabled = val}
                />
            </Flex>
            <Flex gap={10} align='center'>
                <DropdownButton v-show={!isXs.value} items={batchItems} />
                <ButtonFilterItem
                    text={msg => msg.limit.button.test}
                    icon={Operation}
                    onClick={test}
                />
                <ButtonFilterItem
                    v-show={!isXs.value}
                    text={msg => msg.base.option}
                    icon={SetUp}
                    onClick={() => createTabAfterCurrent(optionPageUrl)}
                />
                <ElTooltip
                    visible={tipVisible.value}
                    // Only close visible
                    onUpdate:visible={val => !val && closeTip()}
                    placement='bottom'
                    effect='light'
                    content={t(msg => msg.limit.emptyTips)}
                    v-slots={{
                        content: () => (<Flex gap={4} align='center'>
                            <ElText type='primary'><ElIcon><WarningFilled /></ElIcon></ElText>
                            <ElText >{t(msg => msg.limit.emptyTips)}</ElText>
                        </Flex>),
                        default: () => (
                            <ButtonFilterItem
                                text={msg => msg.button.create}
                                type="success"
                                icon={Plus}
                                onClick={handleCreateClick}
                            />
                        )
                    }}
                />
            </Flex>
        </Flex>
    )
})

export default _default