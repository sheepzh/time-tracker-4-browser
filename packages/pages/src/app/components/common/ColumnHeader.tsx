import { InfoFilled } from "@element-plus/icons-vue"
import Flex from "@pages/components/Flex"
import { ElIcon, ElTooltip } from "element-plus"
import { defineComponent, useSlots } from "vue"

const ColumnHeader = defineComponent<{ label: string, tooltipContent?: string }>(({ label, tooltipContent }) => {
    const slots = useSlots()
    return () => (
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
}, { props: ['label', 'tooltipContent'] })

export default ColumnHeader