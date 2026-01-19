import { Delete, Edit } from "@element-plus/icons-vue"
import Flex from "@pages/components/Flex"
import { ElButton } from "element-plus"
import { defineComponent } from "vue"

type Props = {
    value: timer.site.Cate
    onEdit?: (e: MouseEvent) => void
    onDelete?: (e: MouseEvent) => void
}

const OptionItem = defineComponent<Props>(props => {
    return () => (
        <Flex justify="space-between" align="center" gap={5} width='100%' height='100%'>
            <Flex flex={1}>{props.value.name}</Flex>
            <Flex>
                <ElButton
                    size="small"
                    link
                    icon={Edit}
                    type="primary"
                    onClick={props.onEdit}
                />
                <ElButton
                    size="small"
                    link
                    icon={Delete}
                    type="danger"
                    onClick={props.onDelete}
                />
            </Flex>
        </Flex>
    )
}, { props: ['value', 'onEdit', 'onDelete'] })

export default OptionItem