/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { t } from "@app/locale"
import { OPTION_ROUTE } from '@app/router/constants'
import optionDatabase from '@db/option-database'
import { useRequest } from '@hooks/useRequest'
import Flex from "@pages/components/Flex"
import { getColor } from '@pages/util/style'
import { getAppPageUrl } from '@util/constant/url'
import { ElCard, ElLink, ElProgress, ElText } from "element-plus"
import { computed, defineComponent, type StyleValue } from "vue"
import { useDataMemory } from "./context"
import DataManageAlert from './DataManageAlert'

const byte2Mb = (size: number) => Math.round((size || 0) / 1024.0 / 1024.0 * 1000) / 1000

const IDB_THRESHOLD_MB = 5
const IDB_THRESHOLD_PERCENTAGE = 75

function computeColor(percentage: number, total: number): string | undefined {
    if (!total) {
        return getColor('warning')
    } else if (percentage < 50) {
        return getColor('primary')
    } else if (percentage < IDB_THRESHOLD_PERCENTAGE) {
        return getColor('warning')
    } else {
        return getColor('danger')
    }
}

const totalTitle = (totalMb: number) => totalMb
    ? t(msg => msg.dataManage.totalMemoryAlert, { size: totalMb })
    : t(msg => msg.dataManage.totalMemoryAlert1)


const _default = defineComponent(() => {
    const { memory } = useDataMemory()
    const { data: option } = useRequest(() => optionDatabase.getOption())
    const usedMb = computed(() => byte2Mb(memory.value?.used))
    const totalMb = computed(() => byte2Mb(memory.value?.total))
    const percentage = computed(() => memory.value?.total ? Math.round(memory.value?.used * 10000.0 / memory.value.total) / 100 : 0)
    const color = computed(() => computeColor(percentage.value, memory.value.total))
    const idbTipVisible = computed(() => {
        if (option.value?.storage !== 'classic') return false
        return totalMb.value ? percentage.value > IDB_THRESHOLD_PERCENTAGE : usedMb.value > IDB_THRESHOLD_MB
    })

    return () => (
        <ElCard
            style={{ width: '100%' } satisfies StyleValue}
            bodyStyle={{ height: '100%', boxSizing: 'border-box' }}
        >
            <Flex column height='100%' align="center">
                <DataManageAlert
                    type={totalMb.value ? "info" : "warning"}
                    text={totalTitle(totalMb.value)}
                />
                <Flex flex={1} height={0}>
                    <ElProgress
                        strokeWidth={10}
                        percentage={percentage.value}
                        type="circle"
                        color={color.value}
                        style={{ display: 'flex', marginTop: '30px' } satisfies StyleValue}
                    />
                </Flex>
                <Flex justify='center' column gap={10}>
                    <ElText style={{ color: color.value }} size='large'>
                        {t(msg => msg.dataManage.usedMemoryAlert, { size: usedMb.value })}
                    </ElText>
                    {idbTipVisible.value && (
                        <ElLink
                            type='primary' underline
                            href={getAppPageUrl(OPTION_ROUTE, { i: 'tracking' })}
                        >
                            {t(msg => msg.dataManage.idbAlert)}
                        </ElLink>
                    )}
                </Flex>
            </Flex>
        </ElCard>
    )
})

export default _default