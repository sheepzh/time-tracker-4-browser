/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import AlertLines from '@app/components/common/AlertLines'
import Flex from '@pages/components/Flex'
import { PSL_HOMEPAGE } from '@util/constant/url'
import type { FunctionalComponent, StyleValue } from "vue"
import List from "./List"

const pslStyle: StyleValue = {
    fontSize: "var(--el-alert-description-font-size)",
    color: "var(--el-color-info)",
    marginInline: "2px",
}

const Merge: FunctionalComponent = () => (
    <Flex gap={20} column padding={15}>
        <AlertLines
            title={msg => msg.siteManage.merge.infoAlertTitle}
            lines={[
                msg => msg.siteManage.merge.infoAlert0,
                msg => msg.siteManage.merge.infoAlert1,
                msg => msg.siteManage.merge.infoAlert2,
                msg => msg.siteManage.merge.infoAlert3,
                msg => msg.siteManage.merge.infoAlert4,
                [msg => msg.siteManage.merge.infoAlert5, {
                    psl: <a href={PSL_HOMEPAGE} style={pslStyle} target="_blank" >Public Suffix List</a>
                }],
            ]}
        />
        <List />
    </Flex>
)
Merge.displayName = 'Merge'

export default Merge
