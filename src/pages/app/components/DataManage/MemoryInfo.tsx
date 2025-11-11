/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { t } from "@app/locale"
import Flex from "@pages/components/Flex"
import { ElCard, ElProgress } from "element-plus"
import { computed, defineComponent, type StyleValue } from "vue"
import { useDataMemory } from "./context"
import DataManageAlert from './DataManageAlert'

const byte2Mb = (size: number) => Math.round((size || 0) / 1024.0 / 1024.0 * 1000) / 1000

function computeColor(percentage: number, total: number): string {
    // Danger color
    let typeColor = '#F56C6C'
    // Primary color
    if (percentage < 50) typeColor = '#409EFF'
    // Warning color
    else if (percentage < 75) typeColor = '#E6A23C'
    // Specially, show warning color if not detect the max memory
    if (!total) typeColor = '#E6A23C'
    return typeColor
}

const totalTitle = (totalMb: number) => totalMb
    ? t(msg => msg.dataManage.totalMemoryAlert, { size: totalMb })
    : t(msg => msg.dataManage.totalMemoryAlert1)

const _default = defineComponent(() => {
    const { memory } = useDataMemory()

    const usedMb = computed(() => byte2Mb(memory.value?.used))
    const totalMb = computed(() => byte2Mb(memory.value?.total))
    const percentage = computed(() => memory.value?.total ? Math.round(memory.value?.used * 10000.0 / memory.value.total) / 100 : 0)
    const color = computed(() => computeColor(percentage.value, memory.value.total))

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
                <div style={{ userSelect: 'none' }}>
                    <h3 style={{ color: color.value }}>
                        {t(msg => msg.dataManage.usedMemoryAlert, { size: usedMb.value })}
                    </h3>
                </div>
            </Flex>
        </ElCard>
    )
})

export default _default