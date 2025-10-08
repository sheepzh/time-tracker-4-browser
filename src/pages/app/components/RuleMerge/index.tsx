/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import AlertLines from '@app/components/common/AlertLines'
import Flex from "@pages/components/Flex"
import { PSL_HOMEPAGE } from '@util/constant/url'
import { ElCard } from "element-plus"
import type { FunctionalComponent, StyleValue } from "vue"
import ContentContainer from "../common/ContentContainer"
import ItemList from "./ItemList"

const pslStyle: StyleValue = {
    fontSize: "var(--el-alert-description-font-size)",
    color: "var(--el-color-info)",
    marginInline: "2px",
}

const RuleMerge: FunctionalComponent = () => (
    <ContentContainer>
        <ElCard>
            <Flex column gap={20}>
                <AlertLines
                    title={msg => msg.mergeRule.infoAlertTitle}
                    lines={[
                        msg => msg.mergeRule.infoAlert0,
                        msg => msg.mergeRule.infoAlert1,
                        msg => msg.mergeRule.infoAlert2,
                        msg => msg.mergeRule.infoAlert3,
                        msg => msg.mergeRule.infoAlert4,
                        [msg => msg.mergeRule.infoAlert5, {
                            psl: <a href={PSL_HOMEPAGE} style={pslStyle} target="_blank" >Public Suffix List</a>
                        }],
                    ]}
                />
                <ItemList />
            </Flex>
        </ElCard>
    </ContentContainer>
)
RuleMerge.displayName = 'RuleMerge'

export default RuleMerge
