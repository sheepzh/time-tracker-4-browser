/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { PSL_HOMEPAGE } from '@util/constant/url'
import type { FunctionalComponent, StyleValue } from "vue"
import AlertBox from '../AlertBox'
import ItemList from "./ItemList"

const pslStyle: StyleValue = {
    fontSize: "var(--el-alert-description-font-size)",
    color: "var(--el-color-info)",
    marginInline: "2px",
}

const Merge: FunctionalComponent = () => (
    <AlertBox
        title={msg => msg.rule.merge.infoAlertTitle}
        lines={[
            msg => msg.rule.merge.infoAlert0,
            msg => msg.rule.merge.infoAlert1,
            msg => msg.rule.merge.infoAlert2,
            msg => msg.rule.merge.infoAlert3,
            msg => msg.rule.merge.infoAlert4,
            [msg => msg.rule.merge.infoAlert5, {
                psl: <a href={PSL_HOMEPAGE} style={pslStyle} target="_blank" >Public Suffix List</a>
            }],
        ]}
    >
        <ItemList />
    </AlertBox>
)
Merge.displayName = 'Merge'

export default Merge
