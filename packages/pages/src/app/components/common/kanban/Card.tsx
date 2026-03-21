/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { I18nKey, t } from '@app/locale'
import { useXsState } from '@hooks/useMediaSize'
import { ElCard } from "element-plus"
import { defineComponent, h, useSlots, type StyleValue } from "vue"

const TITLE_STYLE: StyleValue = {
    position: 'absolute',
    top: '5px',
    insetInlineStart: '10px',
    fontSize: '12px',
    color: 'var(--el-text-color-regular)',
    zIndex: 1000,
}

const _default = defineComponent<{ title: I18nKey }>(props => {
    const { default: default_, filter } = useSlots()
    const isXs = useXsState()

    return () => (
        <ElCard bodyStyle={{ position: 'relative' }}>
            <div style={TITLE_STYLE}>{t(props.title)}</div>
            {!!filter && !isXs.value && (
                <div
                    style={{
                        paddingTop: '10px', paddingBottom: '14px',
                        borderBottom: '1px var(--el-border-color) var(--el-border-style)',
                    }}
                >
                    {h(filter)}
                </div>
            )}
            {!!default_ && h(default_)}
        </ElCard>
    )
}, { props: ['title'] })

export default _default