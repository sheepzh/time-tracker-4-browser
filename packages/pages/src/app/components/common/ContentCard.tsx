/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { ElCard } from "element-plus"
import type { FunctionalComponent, StyleValue } from "vue"

const ContentCard: FunctionalComponent = (_, ctx) => (
    <ElCard
        style={{ flex: 1, height: 0 } satisfies StyleValue}
        bodyStyle={{ height: '100%', boxSizing: 'border-box' }}
        v-slots={ctx.slots}
    />
)

export default ContentCard