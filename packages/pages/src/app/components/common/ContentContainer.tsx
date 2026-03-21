/**
 * Copyright (c) 2021-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { css } from '@emotion/css'
import Flex from "@pages/components/Flex"
import { ElCard, useNamespace } from "element-plus"
import { type FunctionalComponent, h, type StyleValue } from "vue"
import ContentCard from "./ContentCard"

const FILTER_BODY_STYLE: StyleValue = {
    paddingBottom: '18px',
    paddingTop: '18px',
    boxSizing: 'border-box',
    width: '100%',
    userSelect: 'none',
}

const useContainerStyle = () => {
    const btnNs = useNamespace('button')
    return css`
        & .${btnNs.b()}+.${btnNs.b()} {
            margin-inline-start: 0px;
        }
    `
}

export const FilterContainer: FunctionalComponent = (_, ctx) => (
    <ElCard
        bodyStyle={FILTER_BODY_STYLE}
        bodyClass={useContainerStyle()}
        v-slots={ctx.slots}
    />
)

const _default: FunctionalComponent<{ class?: string }> = (props, ctx) => {
    const { default: default_, filter, content } = ctx.slots

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
            {filter && <FilterContainer>{h(filter)}</FilterContainer>}
            {!!default_ && <Flex column gap={15} flex={1} height={0} width="100%">{h(default_)}</Flex>}
            {!default_ && content && <ContentCard v-slots={content} />}
        </Flex>
    )
}

export default _default