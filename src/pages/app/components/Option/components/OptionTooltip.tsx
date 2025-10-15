import { InfoFilled } from "@element-plus/icons-vue"
import { ElIcon, ElTooltip } from "element-plus"
import { type FunctionalComponent } from "vue"

const OptionTooltip: FunctionalComponent<{}> = (_, { slots: { default: content } }) => (
    content ? (
        <ElTooltip v-slots={{ content }}>
            <ElIcon size={15}><InfoFilled /></ElIcon>
        </ElTooltip>
    ) : null
)
OptionTooltip.displayName = 'OptionTooltip'

export default OptionTooltip