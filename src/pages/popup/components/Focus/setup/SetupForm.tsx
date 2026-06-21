import CondEditor from '@pages/components/CondEditor'
import Flex from '@pages/components/Flex'
import TimeInput from '@pages/components/TimeInput'
import { ALL_FOCUS_POLICIES, FOCUS_COND_PLACEHOLDER } from '@pages/util/focus'
import { t } from '@popup/locale'
import { isPolicy } from '@util/focus'
import { ElCheckbox, ElRadioButton, ElRadioGroup, ElText } from 'element-plus'
import { defineComponent, useSlots, type StyleValue } from 'vue'
import { useFocusSetup } from '../context'

const CARD_STYLE: StyleValue = {
    borderRadius: 'var(--el-border-radius-base)',
    border: '1px solid var(--el-border-color-lighter)',
    backgroundColor: 'var(--el-fill-color-blank)',
    boxSizing: 'border-box',
}

const Card = defineComponent<{}>(() => {
    return () => (
        <Flex column gap={12} padding='12px 14px' style={CARD_STYLE}>
            {useSlots().default?.()}
        </Flex>
    )
})

const FormItem = defineComponent<{ label: string }>(props => {
    return () => (
        <Flex column gap={8}>
            <Flex align='center'>
                <ElText size='large' tag='h4'>{props.label}</ElText>
            </Flex>
            {useSlots().default?.()}
        </Flex>
    )
}, { props: ['label'] })

const SetupForm = defineComponent<{}>(() => {
    const { form, method } = useFocusSetup()

    return () => (
        <Flex column flex={1} gap={14} paddingBlock={10}>
            <Card v-show={method.value === 'focus'}>
                <FormItem label={t(msg => msg.shared.focus.duration)}>
                    <Flex gap={10} align='center'>
                        <TimeInput
                            modelValue={form.duration}
                            onChange={v => form.duration = v}
                            hideSeconds
                            style={{ flex: 1 }}
                            size='default'
                            placeholder={t(msg => msg.shared.limit.unlimited)}
                        />
                        <ElCheckbox
                            disabled={!form.duration}
                            modelValue={!!form.duration && form.allowDelay}
                            onChange={v => form.allowDelay = Boolean(v)}
                            label={t(msg => msg.shared.limit.allowDelay)}
                            ariaLabel={t(msg => msg.shared.limit.allowDelay)}
                            border
                        />
                    </Flex>
                </FormItem>
            </Card>
            <Card v-show={method.value === 'pomodoro'}>
                <Flex gap={10}>
                    <FormItem label={t(msg => msg.shared.focus.duration)} style={{ flex: 1 } satisfies StyleValue}>
                        <TimeInput
                            modelValue={form.duration}
                            onChange={val => form.duration = val}
                            hideSeconds
                            width='100%'
                            size='default'
                        />
                    </FormItem>
                    <FormItem label={t(msg => msg.shared.focus.break)} style={{ flex: 1 } satisfies StyleValue}>
                        <TimeInput
                            modelValue={form.break}
                            onChange={val => form.break = val}
                            hideSeconds
                            width='100%'
                            size='default'
                        />
                    </FormItem>
                </Flex>
            </Card>
            {/* Card 2: Rules — fills remaining vertical space */}
            <Card style={{ flex: 1 } satisfies StyleValue} >
                <Flex width='100%' justify='space-between' gap={5}>
                    <ElRadioGroup modelValue={form.policy} onChange={v => isPolicy(v) && (form.policy = v)}>
                        {ALL_FOCUS_POLICIES.map(m => (
                            <ElRadioButton
                                value={m}
                                label={t(msg => msg.shared.focus.policy[m].label)}
                            />
                        ))}
                    </ElRadioGroup>
                    <ElText type='info'>
                        {t(msg => msg.shared.focus.policy[form.policy].desc)}
                    </ElText>
                </Flex>
                <Flex flex={1} width='100%' style={{ minHeight: 0 } satisfies StyleValue}>
                    <CondEditor
                        modelValue={form.cond}
                        onChange={v => form.cond = v}
                        placeholder={FOCUS_COND_PLACEHOLDER[form.policy]}
                    />
                </Flex>
            </Card>
        </Flex>
    )
})

export default SetupForm
