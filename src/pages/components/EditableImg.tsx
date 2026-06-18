import { t } from '@app/locale'
import { Check, Close, Edit, Picture } from '@element-plus/icons-vue'
import { useState } from '@hooks'
import { ElButton, ElIcon, ElInput, ElPopover, ElText } from 'element-plus'
import { computed, CSSProperties, defineComponent, ref, watch } from 'vue'
import Flex from './Flex'
import Img, { ALL_IMG_PROPS, type ImgProps } from './Img'

type EditableImgProps = ImgProps & {
    onSave: ArgCallback<string | undefined>
}

type ImgSetupProps = Pick<EditableImgProps, 'onSave'> & {
    initial: string
    onClose: NoArgCallback
}

type SetupState = 'empty' | 'error' | 'ready'
const STATE_STYLES: Record<SetupState, CSSProperties> = {
    empty: {
        borderColor: 'var(--el-border-color-lighter)',
        backgroundColor: 'var(--el-fill-color-blank)'
    },
    error: {
        borderColor: 'var(--el-color-danger)',
        backgroundColor: 'var(--el-color-danger-light-9)'
    },
    ready: {
        borderColor: 'var(--el-color-success)',
        backgroundColor: 'var(--el-color-success-light-9)'
    }
}

const ImgSetup = defineComponent<ImgSetupProps>(props => {
    const url = ref(props.initial)
    const [error, setError, resetError] = useState<string>()
    const state = computed<SetupState>(() => {
        if (!url.value) return 'empty'
        if (error.value) return 'error'
        return 'ready'
    })
    watch(url, val => {
        if (!val.trim()) return resetError()
        try {
            new URL(val)
            resetError()
        } catch {
            setError('INVALID URL')
        }
    })

    const handleSave = () => {
        if (state.value === 'error') return
        props.onSave(url.value.trim() || undefined)
    }

    return () => (
        <Flex column gap={10}>
            <Flex
                align="center"
                justify="center"
                height={120}
                padding={8}
                style={{
                    border: '1px solid',
                    borderRadius: 'var(--el-border-radius-base)',
                    transition: 'all var(--el-transition-duration)',
                    boxSizing: 'border-box',
                    ...STATE_STYLES[state.value],
                }}
            >
                <ElIcon v-show={state.value === 'empty'} size={36} color="var(--el-color-info)">
                    <Picture />
                </ElIcon>
                <ElText v-show={error.value} type="danger">
                    {error.value}
                </ElText>
                <Img
                    v-show={state.value === 'ready'}
                    src={url.value}
                    onError={() => setError("FAILED TO LOAD")}
                    size={80}
                    style={{ objectFit: 'contain' }}
                />
            </Flex>
            <ElInput
                modelValue={url.value}
                onUpdate:modelValue={val => url.value = val}
                size="small"
                clearable
                placeholder="e.g. https://example.com/image.png"
                type={error.value ? 'error' : (url.value ? 'success' : '')}
            />
            <Flex justify="flex-end" gap={4}>
                <ElButton icon={Close} size="small" onClick={props.onClose}>
                    {t(msg => msg.button.cancel)}
                </ElButton>
                <ElButton icon={Check} size="small" onClick={handleSave} disabled={state.value === 'error'}>
                    {t(msg => msg.button.save)}
                </ElButton>
            </Flex>
        </Flex>
    )
}, { props: ['initial', 'onSave', 'onClose'] })

const EditableImg = defineComponent<EditableImgProps>(props => {
    const visible = ref(false)
    const hide = () => visible.value = false
    const handleSave = (url: string | undefined) => {
        props.onSave(url)
        hide()
    }

    return () => (
        <Flex align="center" gap={2}>
            <Img {...props} />
            <ElPopover
                visible={visible.value}
                onUpdate:visible={val => visible.value = val}
                placement="top"
                width={280}
                trigger="click"
                // Destroy when inactive to reset url
                persistent={false}
                v-slots={{
                    reference: () => <ElIcon style={{ cursor: 'pointer' }}><Edit /></ElIcon>,
                    default: () => <ImgSetup initial={props.src ?? ''} onSave={handleSave} onClose={hide} />
                }}
            />
        </Flex>
    )
}, { props: [...ALL_IMG_PROPS, 'onSave'] })

export default EditableImg