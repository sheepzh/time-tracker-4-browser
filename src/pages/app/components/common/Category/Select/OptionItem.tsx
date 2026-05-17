import { Delete, Edit } from "@element-plus/icons-vue"
import Flex from "@pages/components/Flex"
import { ElButton } from "element-plus"
import { defineComponent } from "vue"

type Props = {
    value: timer.site.Cate
    onEdit?: ArgCallback<MouseEvent>
    onDelete?: ArgCallback<MouseEvent>
    onSelect?: NoArgCallback
}

const OptionItem = defineComponent<Props>(props => {
    const handleClick = (e: MouseEvent) => {
        e.stopPropagation()
        props.onSelect?.()
    }

    return () => (
        <Flex justify="space-between" align="center" gap={5} width='100%' height='100%' onClick={handleClick}>
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
}, { props: ['value', 'onEdit', 'onDelete', 'onSelect'] })

export default OptionItem