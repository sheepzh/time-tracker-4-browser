/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { cvtPxScale } from '@pages/components/common'
import { ElCard, ElCol } from "element-plus"
import type { CSSProperties, FunctionalComponent, StyleValue } from "vue"

export type DashboardCardProps = {
    span: number
    height?: CSSProperties['height']
    bodyHeight?: CSSProperties['height']
}

const DashboardCard: FunctionalComponent<DashboardCardProps> = ({ span, height, bodyHeight }, ctx) => (
    <ElCol span={span}>
        <ElCard
            style={{
                height: cvtPxScale(height ?? 320),
                marginBlockEnd: '15px',
            } satisfies StyleValue}
            bodyStyle={{
                padding: '20px',
                width: '100%',
                height: cvtPxScale(bodyHeight ?? '100%'),
                boxSizing: 'border-box',
            }}
            v-slots={ctx.slots}
        />
    </ElCol>
)

DashboardCard.displayName = 'DashboardCard'

export default DashboardCard
