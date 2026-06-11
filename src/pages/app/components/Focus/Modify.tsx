import { addFocusPreset, saveFocusPreset } from '@api/sw/focus'
import { t } from '@app/locale'
import { Check } from '@element-plus/icons-vue'
import { useSwitch } from '@hooks'
import CondEditor from '@pages/components/CondEditor'
import Flex from '@pages/components/Flex'
import TimeInput from '@pages/components/TimeInput'
import { ALL_FOCUS_MODES, FOCUS_COND_PLACEHOLDER, FOCUS_TEMPLATE_DEFAULTS } from '@pages/util/focus'
import {
    ElButton, ElCheckbox, ElDialog, ElForm, ElFormItem, ElInput, ElMessage, ElRadioButton, ElRadioGroup
} from 'element-plus'
import { createStringUnionGuard } from 'typescript-guard'
import { computed, defineComponent, reactive, type StyleValue, toRaw } from 'vue'
import { type ModifyInstance, useFocusList } from './context'

const ALL_TEMPLATES: tt4b.focus.Template[] = ['focus', 'pomodoro']

const isTemplate = createStringUnionGuard<tt4b.focus.Template>('focus', 'pomodoro')
const isMode = createStringUnionGuard<tt4b.focus.Mode>('allow', 'block')

type Form = MakeOptionalUndefined<MakeOptional<tt4b.focus.Preset, 'id'>>

const createInitial = (): Form => ({
    id: undefined,
    name: `PRESET-${String(Date.now() % 10000).padStart(4, '0')}`,
    template: 'focus',
    ...FOCUS_TEMPLATE_DEFAULTS['focus'],
})


const _default = defineComponent<{}>((_, ctx) => {
    const { refresh } = useFocusList()
    const [visible, open, close] = useSwitch()
    const formData = reactive(createInitial())
    const editing = computed(() => !!formData.id)

    const reset = (data: MakeOptional<tt4b.focus.Preset, 'id'>) => {
        formData.id = data.id
        formData.name = data.name
        formData.template = data.template
        formData.mode = data.mode
        formData.cond = data.cond
        formData.duration = data.duration
        formData.break = data.break
        formData.allowDelay = data.allowDelay
    }

    ctx.expose({
        create() {
            reset(createInitial())
            open()
        },
        modify(val: tt4b.focus.Preset) {
            reset(val)
            open()
        }
    } satisfies ModifyInstance)

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            return ElMessage.error('Name is required')
        }

        const { id, template, mode, cond, duration, break: breakDuration } = formData

        if (template === 'pomodoro' && (!duration || !breakDuration)) {
            return ElMessage.error(t(msg => msg.shared.focus.noTime))
        }

        if (template === 'focus' && mode === 'allow' && !cond.length) {
            return ElMessage.error(t(msg => msg.shared.focus.noAllowUrl))
        }

        if (editing.value && id !== undefined) {
            await saveFocusPreset({ ...toRaw(formData), id })
        } else {
            const { id: _, ...data } = toRaw(formData)
            await addFocusPreset(data)
        }

        close()
        ElMessage.success(t(msg => msg.operation.successMsg))
        refresh()
    }

    const handleTemplateChange = (val: unknown) => {
        if (!isTemplate(val)) return
        if (val === formData.template) return

        formData.template = val
        const defaults = FOCUS_TEMPLATE_DEFAULTS[val]
        formData.mode = defaults.mode
        formData.cond = [...defaults.cond]
        formData.duration = defaults.duration
        formData.break = defaults.break
        formData.allowDelay = defaults.allowDelay
    }

    return () => (
        <ElDialog
            width={560}
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
            <ElForm labelWidth={120}>
                <ElFormItem required label={t(msg => msg.focus.presetName)}>
                    <ElInput
                        modelValue={formData.name}
                        onInput={val => formData.name = val}
                        clearable
                        onClear={() => formData.name = ''}
                    />
                </ElFormItem>
                <ElFormItem label={t(msg => msg.focus.template)}>
                    <ElRadioGroup modelValue={formData.template} onChange={handleTemplateChange}>
                        {ALL_TEMPLATES.map(tpl => (
                            <ElRadioButton value={tpl} label={t(msg => msg.shared.focus.template[tpl].label)} />
                        ))}
                    </ElRadioGroup>
                </ElFormItem>
                <ElFormItem label={t(msg => msg.shared.focus.template[formData.template].label)} required={formData.mode === 'allow'}>
                    <Flex column>
                        <ElRadioGroup modelValue={formData.mode} onChange={val => isMode(val) && (formData.mode = val)}>
                            {ALL_FOCUS_MODES.map(mode => (
                                <ElRadioButton value={mode} label={t(msg => msg.shared.focus.mode[mode].label)} />
                            ))}
                        </ElRadioGroup>
                        <CondEditor
                            modelValue={formData.cond}
                            onChange={v => formData.cond = v}
                            placeholder={FOCUS_COND_PLACEHOLDER[formData.mode]}
                        />
                    </Flex>
                </ElFormItem>
                <ElFormItem label={t(msg => msg.shared.focus.duration)}>
                    <Flex gap={10} align="center" width="100%">
                        <TimeInput
                            modelValue={formData.duration}
                            onChange={val => formData.duration = val}
                            hideSeconds
                            style={{ flex: 1 } satisfies StyleValue}
                        />
                        {formData.template === 'focus' && (
                            <ElCheckbox
                                disabled={!formData.duration}
                                modelValue={!!formData.duration && formData.allowDelay}
                                onChange={v => formData.allowDelay = Boolean(v)}
                                label={t(msg => msg.shared.limit.allowDelay)}
                                ariaLabel={t(msg => msg.shared.limit.allowDelay)}
                                border
                            />
                        )}
                    </Flex>
                </ElFormItem>
                {formData.template === 'pomodoro' && (
                    <ElFormItem label={t(msg => msg.shared.focus.break)}>
                        <TimeInput
                            modelValue={formData.break}
                            onChange={val => formData.break = val}
                            hideSeconds
                            style={{ width: '100%' } satisfies StyleValue}
                        />
                    </ElFormItem>
                )}
            </ElForm>
        </ElDialog>
    )
})

export default _default