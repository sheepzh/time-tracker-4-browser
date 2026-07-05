import { addFocusPreset, saveFocusPreset } from '@api/sw/focus'
import { t } from '@app/locale'
import { Check } from '@element-plus/icons-vue'
import { useOperation, useSwitch } from '@hooks'
import CondEditor from '@pages/components/CondEditor'
import Flex from '@pages/components/Flex'
import TimeInput from '@pages/components/TimeInput'
import { ALL_FOCUS_POLICIES, FOCUS_COND_PLACEHOLDER, FOCUS_METHOD_DEFAULTS } from '@pages/util/focus'
import { isMethod, isPolicy } from '@util/focus'
import { ElButton, ElCheckbox, ElDialog, ElForm, ElFormItem, ElInput, ElRadio, ElRadioGroup } from 'element-plus'
import { computed, defineComponent, reactive, type StyleValue, toRaw } from 'vue'
import { type ModifyInstance, useFocusList } from './context'

const ALL_METHODS: tt4b.focus.Method[] = ['focus', 'pomodoro']

type Form = MakeOptionalUndefined<MakeOptional<tt4b.focus.Preset, 'id'>>

const createInitial = (): Form => ({
    id: undefined,
    name: `PRESET-${String(Date.now() % 10000).padStart(4, '0')}`,
    method: 'focus',
    ...FOCUS_METHOD_DEFAULTS['focus'],
})

const _default = defineComponent<{}>((_, ctx) => {
    const { refresh } = useFocusList()
    const [visible, open, close] = useSwitch()
    const form = reactive(createInitial())
    const editing = computed(() => !!form.id)

    const apply = (data: Form) => {
        form.id = data.id
        form.name = data.name
        form.method = data.method
        form.policy = data.policy
        form.cond = [...data.cond]
        form.duration = data.duration
        form.break = data.break
        form.allowDelay = data.allowDelay
    }

    ctx.expose({
        create() {
            apply(createInitial())
            open()
        },
        modify(val: tt4b.focus.Preset) {
            const { duration, break: break_, allowDelay } = val
            apply({ ...val, duration, break: break_, allowDelay })
            open()
        }
    } satisfies ModifyInstance)

    const handleSubmit = useOperation(async () => {
        if (!form.name.trim()) throw 'Name is required'

        const { id, method, policy, cond, duration, break: breakDuration } = form

        if (method === 'pomodoro' && (!duration || !breakDuration)) {
            throw t(msg => msg.focus.noTime)
        }

        if (method === 'focus' && policy === 'allow' && !cond.length) {
            throw t(msg => msg.focus.noAllowUrl)
        }

        if (editing.value && id !== undefined) {
            await saveFocusPreset({ ...toRaw(form), id })
        } else {
            const { id: _, ...data } = toRaw(form)
            await addFocusPreset(data)
        }
    }, {
        onSuccess: () => {
            close()
            refresh()
        }
    })

    const onMethodChange = (val: unknown) => {
        if (!isMethod(val)) return
        if (val === form.method) return

        const { name, id } = form
        apply({ ...FOCUS_METHOD_DEFAULTS[val], method: val, name, id })
    }

    return () => (
        <ElDialog
            width={640}
            title={t(msg => msg.button[editing.value ? 'modify' : 'create'])}
            modelValue={visible.value}
            onClose={close}
            v-slots={{
                footer: () => (
                    <ElButton type='primary' icon={Check} onClick={handleSubmit}>
                        {t(msg => msg.button.save)}
                    </ElButton>
                )
            }}
        >
            <ElForm labelWidth={140}>
                <ElFormItem required label={t(msg => msg.focus.presetName)}>
                    <ElInput
                        modelValue={form.name}
                        onInput={val => form.name = val}
                        clearable
                        onClear={() => form.name = ''}
                    />
                </ElFormItem>
                <ElFormItem label={t(msg => msg.focus.method.label)}>
                    <ElRadioGroup modelValue={form.method} onChange={onMethodChange}>
                        {ALL_METHODS.map(method => (
                            <ElRadio value={method} label={t(msg => msg.focus.method[method].label)} />
                        ))}
                    </ElRadioGroup>
                </ElFormItem>
                <ElFormItem label={t(msg => msg.focus.policy.label)} required={form.policy === 'allow'}>
                    <Flex column gap={6} width='100%'>
                        <ElRadioGroup modelValue={form.policy} onChange={v => isPolicy(v) && (form.policy = v)}>
                            {ALL_FOCUS_POLICIES.map(policy => (
                                <ElRadio value={policy} label={t(msg => msg.focus.policy[policy].label)} />
                            ))}
                        </ElRadioGroup>
                        <CondEditor
                            modelValue={form.cond}
                            onChange={v => form.cond = v}
                            placeholder={FOCUS_COND_PLACEHOLDER[form.policy]}
                        />
                    </Flex>
                </ElFormItem>
                <ElFormItem label={t(msg => msg.focus.duration)}>
                    <Flex gap={10} align="center" width="100%">
                        <TimeInput
                            modelValue={form.duration}
                            onChange={val => form.duration = val}
                            hideSeconds
                            style={{ flex: 1 } satisfies StyleValue}
                            placeholder={t(msg => msg.shared.limit.unlimited)}
                            clearable={form.method === 'focus'}
                        />
                        {form.method === 'focus' && (
                            <ElCheckbox
                                disabled={!form.duration}
                                modelValue={!!form.duration && form.allowDelay}
                                onChange={v => form.allowDelay = Boolean(v)}
                                label={t(msg => msg.shared.limit.allowDelay)}
                                ariaLabel={t(msg => msg.shared.limit.allowDelay)}
                                border
                            />
                        )}
                    </Flex>
                </ElFormItem>
                {form.method === 'pomodoro' && (
                    <ElFormItem label={t(msg => msg.focus.break)}>
                        <TimeInput
                            modelValue={form.break}
                            onChange={val => form.break = val}
                            hideSeconds
                            style={{ width: '100%' } satisfies StyleValue}
                            clearable={false}
                        />
                    </ElFormItem>
                )}
            </ElForm>
        </ElDialog>
    )
})

export default _default