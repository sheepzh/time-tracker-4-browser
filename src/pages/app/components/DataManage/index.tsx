/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import Flex from "@pages/components/Flex"
import { ElScrollbar } from 'element-plus'
import { defineComponent, type StyleValue } from "vue"
import ContentContainer from "../common/ContentContainer"
import ClearPanel from "./ClearPanel"
import MemoryInfo from "./MemoryInfo"
import Migration from "./Migration"
import { initDataManage } from "./context"

export default defineComponent(() => {
    initDataManage()

    return () => (
        <ElScrollbar height="100%" style={{ width: '100%' } satisfies StyleValue}>
            <ContentContainer>
                <Flex gap={22} height={490}>
                    <Flex height='100%' flex={8}>
                        <MemoryInfo />
                    </Flex>
                    <Flex height='100%' flex={11}>
                        <ClearPanel />
                    </Flex>
                    <Flex height='100%' flex={5}>
                        <Migration />
                    </Flex>
                </Flex>
            </ContentContainer >
        </ElScrollbar>
    )
})