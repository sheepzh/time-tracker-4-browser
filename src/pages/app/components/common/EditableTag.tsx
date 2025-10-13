import { Edit } from "@element-plus/icons-vue"
import Flex from "@pages/components/Flex"
import { ElTag, type TagProps } from "element-plus"
import { defineComponent, h, useSlots, type StyleValue } from "vue"

export type EditableTagProps = PartialPick<TagProps, 'type'> & {
    text?: string
    onEdit?: () => void
    closable?: boolean
    onClose?: () => void
}

const EDIT_ICON_STYLE: StyleValue = {
    height: '14px',
    width: '14px',
    cursor: 'pointer',
}

const EditableTag = defineComponent<EditableTagProps>(props => {
    const { default: textSlot } = useSlots()
    return () => (
        <ElTag
            size="large"
            closable={props.closable ?? true}
            onClose={props.onClose}
            type={props.type}
        >
            <Flex align="center" gap={7} style={{ marginInlineEnd: '-3px' }}>
                {textSlot ? h(textSlot) : props.text ?? ''}
                <Flex onClick={props.onEdit} >
                    <Edit style={EDIT_ICON_STYLE} />
                </Flex>
            </Flex>
        </ElTag>
    )
}, { props: ['closable', 'onClose', 'onEdit', 'text', 'type'] })

export default EditableTag