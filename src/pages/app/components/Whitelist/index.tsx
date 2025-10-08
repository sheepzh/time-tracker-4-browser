/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import AlertLines from '@app/components/common/AlertLines'
import Flex from "@pages/components/Flex"
import { ElCard } from "element-plus"
import { type FunctionalComponent } from "vue"
import ContentContainer from "../common/ContentContainer"
import WhitePanel from "./WhitePanel"

const Whitelist: FunctionalComponent = () => (
    <ContentContainer>
        <ElCard>
            <Flex gap={20} column>
                <AlertLines
                    title={msg => msg.whitelist.infoAlertTitle}
                    lines={[
                        msg => msg.whitelist.infoAlert0,
                        msg => msg.whitelist.infoAlert1,
                    ]}
                />
                <WhitePanel />
            </Flex>
        </ElCard>
    </ContentContainer>
)
Whitelist.displayName = 'Whitelist'

export default Whitelist
