/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { MediaSize, useMediaSize } from '@hooks/useMediaSize'
import Flex from "@pages/components/Flex"
import { ElScrollbar } from 'element-plus'
import { computed, defineComponent, type StyleValue } from "vue"
import ContentContainer from "../common/ContentContainer"
import ClearPanel from './ClearPanel'
import MemoryInfo from "./MemoryInfo"
import Migration from "./Migration"
import { initDataManage } from "./context"

export default defineComponent(() => {
    initDataManage()
    const mediaSize = useMediaSize()
    const ltSm = computed(() => mediaSize.value < MediaSize.sm)

    return () => (
        <ElScrollbar height="100%" style={{ width: '100%' } satisfies StyleValue}>
            <ContentContainer>
                <Flex column gap={22}>
                    <Flex gap={22} height={ltSm.value ? undefined : 300} column={ltSm.value}>
                        <Flex height='100%' flex={5}>
                            <MemoryInfo />
                        </Flex>
                        <Flex height='100%' flex={5}>
                            <Migration />
                        </Flex>
                    </Flex>
                    <ClearPanel />
                </Flex>
            </ContentContainer >
        </ElScrollbar>
    )
})