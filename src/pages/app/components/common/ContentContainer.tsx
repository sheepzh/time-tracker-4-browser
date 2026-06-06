/**
 * Copyright (c) 2021-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { css } from '@emotion/css'
import Flex from "@pages/components/Flex"
import { ElCard, useNamespace } from "element-plus"
import type { FunctionalComponent } from "vue"
import ContentCard from "./ContentCard"

export const FilterContainer: FunctionalComponent = (_, ctx) => {
    const btnNs = useNamespace('button')
    const clz = css`
        padding-block: 18px;
        user-select: none;

        & .${btnNs.b()}+.${btnNs.b()} {
            margin-inline-start: 0px;
        }
    `
    return <ElCard bodyClass={clz} v-slots={ctx.slots} />
}

const _default: FunctionalComponent<{ class?: string }> = (props, ctx) => {
    const { default: children, filter, content } = ctx.slots

    return (
        <Flex
            class={props.class}
            column
            height="100%"
            width="100%"
            padding={20}
            boxSizing="border-box"
            gap={15}
        >
            {filter && <FilterContainer>{filter()}</FilterContainer>}
            {!!children && <Flex column gap={15} flex={1} height={0} width="100%">{children()}</Flex>}
            {!children && content && <ContentCard>{content()}</ContentCard>}
        </Flex>
    )
}

export default _default