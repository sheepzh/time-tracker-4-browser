/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { t, type I18nKey } from '@app/locale'
import { useXsState } from '@hooks'
import Box from '@pages/components/Box'
import { ElCard } from "element-plus"
import { defineComponent, useSlots, type StyleValue } from "vue"

const TITLE_STYLE: StyleValue = {
    position: 'absolute',
    top: '5px',
    insetInlineStart: '10px',
    fontSize: '12px',
    color: 'var(--el-text-color-regular)',
    zIndex: 1000,
}

const FILTER_CONTAINER_STYLE: StyleValue = {
    borderBottom: '1px var(--el-border-color) var(--el-border-style)',
}

const _default = defineComponent<{ title: I18nKey }>(props => {
    const { default: default_, filter } = useSlots()
    const isXs = useXsState()

    return () => (
        <ElCard bodyStyle={{ position: 'relative' }}>
            <div style={TITLE_STYLE}>{t(props.title)}</div>
            {!!filter && !isXs.value && (
                <Box paddingBlock="10px 14px" style={FILTER_CONTAINER_STYLE}>
                    {filter()}
                </Box>
            )}
            {default_?.()}
        </ElCard>
    )
}, { props: ['title'] })

export default _default