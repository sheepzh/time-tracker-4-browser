import { t } from '@app/locale'
import { Check, Close, Edit, Loading, Picture } from '@element-plus/icons-vue'
import { ElButton, ElIcon, ElInput, ElPopover, ElText } from 'element-plus'
import { computed, CSSProperties, defineComponent, ref, shallowRef } from 'vue'
import Flex from './Flex'
import Img, { ALL_IMG_PROPS, type ImgProps } from './Img'

type EditableImgProps = ImgProps & {
    onSave: ArgCallback<string | undefined>
}

type ImgSetupProps = Pick<EditableImgProps, 'onSave'> & {
    initial: string
    onClose: NoArgCallback
}

type SetupState = 'empty' | 'invalid' | 'checking' | 'failed' | 'ready'

const STATE_STYLES: Record<SetupState, CSSProperties> = {
    empty: {
        borderColor: 'var(--el-border-color-lighter)',
        backgroundColor: 'var(--el-fill-color-blank)'
    },
    invalid: {
        borderColor: 'var(--el-color-danger)',
        backgroundColor: 'var(--el-color-danger-light-9)'
    },
    checking: {
        borderColor: 'var(--el-border-color)',
        backgroundColor: 'var(--el-fill-color-light)'
    },
    failed: {
        borderColor: 'var(--el-color-danger)',
        backgroundColor: 'var(--el-color-danger-light-9)'
    },
    ready: {
        borderColor: 'var(--el-color-success)',
        backgroundColor: 'var(--el-color-success-light-9)'
    },
}

const STATE_HINTS: Partial<Record<SetupState, string>> = {
    invalid: 'INVALID URL',
    failed: 'FAILED TO LOAD'
}

const ImgSetup = defineComponent<ImgSetupProps>(props => {
    const url = ref(props.initial)
    const src = computed(() => url.value.trim() ?? undefined)
    const result = shallowRef<{ src: string; ok: boolean }>()

    const state = computed<SetupState>(() => {
        const val = src.value
        if (!val) return 'empty'
        try {
            new URL(val)
        } catch {
            return 'invalid'
        }
        if (result.value?.src !== val) return 'checking'
        return result.value.ok ? 'ready' : 'failed'
    })

    const disabled = computed(() => state.value !== 'empty' && state.value !== 'ready')
    const handleSave = () => !disabled.value && props.onSave(src.value || undefined)

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
                <ElIcon v-show={state.value === 'checking'} class="is-loading" size={36} color="var(--el-color-primary)">
                    <Loading />
                </ElIcon>
                <ElText v-show={!!STATE_HINTS[state.value]} type="danger">
                    {STATE_HINTS[state.value]}
                </ElText>
                {/* Keep the <img> mounted while hidden, so its load/error events keep driving the state */}
                <div v-show={state.value === 'ready'}>
                    <Img
                        src={src.value}
                        onLoad={() => result.value = { src: src.value, ok: true }}
                        onError={() => result.value = { src: src.value, ok: false }}
                        size={80}
                        style={{ objectFit: 'contain' }}
                    />
                </div>
            </Flex>
            <ElInput
                modelValue={url.value}
                onUpdate:modelValue={val => url.value = val}
                size="small"
                clearable
                placeholder="e.g. https://example.com/image.png"
            />
            <Flex justify="flex-end" gap={4}>
                <ElButton icon={Close} size="small" onClick={props.onClose}>
                    {t(msg => msg.button.cancel)}
                </ElButton>
                <ElButton icon={Check} size="small" onClick={handleSave} disabled={disabled.value}>
                    {t(msg => msg.button.save)}
                </ElButton>
            </Flex>
        </Flex>
    )
}, { props: ['initial', 'onSave', 'onClose'] })

export default defineComponent<EditableImgProps>(props => {
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