import { InfoFilled } from "@element-plus/icons-vue"
import Flex from "@pages/components/Flex"
import { ElIcon, ElTooltip } from "element-plus"
import { FunctionalComponent } from 'vue'

type Props = {
    label: string
    tooltipContent?: string
}

const ColumnHeader: FunctionalComponent<Props> = ({ label, tooltipContent }, { slots }) => (
    <Flex justify="center" align="center" gap={4}>
        <span>{label}</span>
        <ElTooltip
            content={tooltipContent}
            placement="top"
            v-slots={{
                content: slots.tooltipContent,
                default: () => (
                    <Flex height='100%'>
                        <ElIcon>
                            <InfoFilled />
                        </ElIcon>
                    </Flex>
                ),
            }}
        />
    </Flex>
)
ColumnHeader.displayName = 'ColumnHeader'

export default ColumnHeader