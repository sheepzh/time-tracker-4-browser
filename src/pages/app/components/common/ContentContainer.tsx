/**
 * Copyright (c) 2021-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { css } from '@emotion/css'
import Flex from "@pages/components/Flex"
import { ElCard, useNamespace } from "element-plus"
import { type FunctionalComponent, h } from "vue"
import ContentCard from "./ContentCard"

export const FilterContainer: FunctionalComponent = (_, ctx) => {
    const cardNs = useNamespace('card')
    const buttonNs = useNamespace('button')
    const clz = css`
        user-select: none;
        .${cardNs.e('body')} {
            padding-bottom: 18px;
            padding-top: 18px;
            box-sizing: border-box;
            width: 100%;
            .${buttonNs.b()}+.${buttonNs.b()} {
                margin-inline-start: 0px;
            }
        }
        @media (max-width: 600px) & .${cardNs.e('body')} {
            flex-direction: column;
            gap: 10px;
        }
    `
    return <ElCard class={clz} v-slots={ctx.slots} />
}

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