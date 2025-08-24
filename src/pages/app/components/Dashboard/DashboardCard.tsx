/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { ElCard, ElCol } from "element-plus"
import type { FunctionalComponent, StyleValue } from "vue"

type Props = {
    span: number
    height?: number
}

const DashboardCard: FunctionalComponent<Props> = ({ span, height }, ctx) => (
    <ElCol span={span}>
        <ElCard
            style={{
                height: height === undefined ? '320px' : `${height}px`,
                marginBlockEnd: '15px',
            } satisfies StyleValue}
            bodyStyle={{ padding: '20px', width: '100%', height: '100%', boxSizing: 'border-box' }}
            v-slots={ctx.slots}
        />
    </ElCol>
)

DashboardCard.displayName = 'DashboardCard'

export default DashboardCard
