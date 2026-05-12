import { t } from '@app/locale'
import { CopyDocument } from '@element-plus/icons-vue'
import { useRequest, useState } from '@hooks'
import Flex from '@pages/components/Flex'
import Img from '@pages/components/Img'
import { generateQrDataUrl } from '@pages/util/qrcode'
import { ElButton, ElForm, ElFormItem, ElInput, ElMessage, ElText } from 'element-plus'
import { computed, defineComponent, toRef, watch } from 'vue'

function extractSecret(otpauth: string): string {
    const raw = new URL(otpauth).searchParams.get('secret')
    return raw ?? 'Secret is unknown'
}

async function copy(text: string) {
    try {
        await navigator.clipboard.writeText(text)
        ElMessage.success('Copied')
    } catch (e) {
        const errMsg = e instanceof Error ? e.message : e ?? 'Unknown error'
        ElMessage.error(`Copy failed: ${errMsg}`)
    }
}

export type FormInstance = {
    getVerifyCode: () => string
}

const _default = defineComponent<{ otpauth: string }>((props, ctx) => {
    const otpauth = toRef(props, 'otpauth')

    const [code, setCode] = useState('')
    watch(otpauth, () => setCode(''), { immediate: true })

    const { data: qrData } = useRequest(
        () => generateQrDataUrl({ text: otpauth.value, size: 200 }),
        { deps: otpauth },
    )
    ctx.expose({
        getVerifyCode: () => code.value,
    } satisfies FormInstance)

    const secret = computed(() => extractSecret(otpauth.value))

    return () => (
        <ElForm labelPosition="top">
            <Flex column marginBottom={12} marginTop={12}>
                <ElText style={{ lineHeight: 1.5 }}>
                    {t(msg => msg.option.limit.level.twoFaScanHint)}
                </ElText>
            </Flex>
            <Flex column align="center" marginBottom={12}>
                <Img src={qrData.value} size={200} />
            </Flex>
            <ElFormItem label='2FA Secret'>
                <ElInput
                    size='small'
                    modelValue={secret.value}
                    readonly v-slots={{
                        append: () => <ElButton size="small" icon={CopyDocument} onClick={() => copy(secret.value)} />,
                    }}
                />
                <Flex marginTop={6}>
                    <ElButton size="small" icon={CopyDocument} onClick={() => copy(otpauth.value)}>
                        {t(msg => msg.option.limit.level.twoFaCopyLink)}
                    </ElButton>
                </Flex>
            </ElFormItem>
            <ElFormItem required label={t(msg => msg.option.limit.level.twoFaVerifyLabel)}>
                <ElInput
                    size='small'
                    modelValue={code.value}
                    onUpdate:modelValue={val => setCode(val.trim())}
                    maxlength={6}
                />
            </ElFormItem>
        </ElForm >
    )
}, { props: ['otpauth'] })

export default _default
