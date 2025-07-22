/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import Flex from "@pages/components/Flex"
import { ElCard } from "element-plus"
import { type FunctionalComponent } from "vue"
import ContentContainer from "../common/ContentContainer"
import AlertInfo from "./AlertInfo"
import ItemList from "./ItemList"

const RuleMerge: FunctionalComponent = () => (
    <ContentContainer>
        <ElCard>
            <Flex column gap={20}>
                <AlertInfo />
                <ItemList />
            </Flex>
        </ElCard>
    </ContentContainer>
)
RuleMerge.displayName = 'RuleMerge'

export default RuleMerge
