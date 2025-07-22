/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { t } from "@app/locale"
import Flex from "@pages/components/Flex"
import { ElAlert, ElCard } from "element-plus"
import { type FunctionalComponent } from "vue"
import ContentContainer from "../common/ContentContainer"
import WhitePanel from "./WhitePanel"

const Whitelist: FunctionalComponent = () => (
    <ContentContainer>
        <ElCard>
            <Flex gap={20} column>
                <ElAlert
                    title={t(msg => msg.whitelist.infoAlertTitle)}
                    style={{ padding: "15px 25px" }}
                    closable={false}
                >
                    <li>{t(msg => msg.whitelist.infoAlert0)}</li>
                    <li>{t(msg => msg.whitelist.infoAlert1)}</li>
                </ElAlert>
                <WhitePanel />
            </Flex>
        </ElCard>
    </ContentContainer>
)
Whitelist.displayName = 'Whitelist'

export default Whitelist
