import { InfoFilled } from '@element-plus/icons-vue'
import { ElIcon, ElTooltip } from 'element-plus'
import { type FunctionalComponent, h, type StyleValue } from 'vue'

const Tag: FunctionalComponent<{}> = (_, { slots: { default: default_ } }) => (
    <a style={{ color: '#F56C6C', fontSize: 'inherit' } satisfies StyleValue}>
        {default_ && h(default_)}
    </a>
)
Tag.displayName = 'OptionTag'
export const OptionTag = Tag

const Tooltip: FunctionalComponent<{}> = (_, { slots: { default: content } }) => (
    content ? (
        <ElTooltip v-slots={{ content }}>
            <ElIcon size={15}><InfoFilled /></ElIcon>
        </ElTooltip>
    ) : null
)
Tooltip.displayName = 'OptionTooltip'
export const OptionTooltip = Tooltip

export { default as OptionItem } from "./Item"
export { default as OptionLines } from "./Lines"
