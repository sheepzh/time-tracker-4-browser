import { OptionItem, OptionLines } from '@app/components/Option/components'
import { t } from '@app/locale'
import { Check, Close } from '@element-plus/icons-vue'
import Flex from '@pages/components/Flex'
import { ElButton, ElDialog, ElInput, ElSelect, ElText, ElTimePicker } from 'element-plus'
import { computed, defineComponent, StyleValue } from 'vue'
import type { CategoryInstance } from '../types'
import Footer from './Footer'
import { useNotification } from './useNotification'
import usePermission from './usePermission'

const CYCLE_LABELS: Record<timer.notification.Cycle, string> = {
    none: t(msg => msg.option.off),
    daily: t(msg => msg.option.notification.cycle.daily),
    weekly: t(msg => msg.option.notification.cycle.weekly),
}

const METHOD_LABELS: Record<timer.notification.Method, string> = {
    browser: t(msg => msg.option.notification.method.browser),
    callback: t(msg => msg.option.notification.method.callback.label),
}

const ALL_WEEKDAYS = t(msg => msg.calendar.weekDays)?.split('|') || []

const PADDING: StyleValue = { paddingInlineStart: '2px' }

const Notification = defineComponent((_, ctx) => {
    const { option, weekday, datetime, reset } = useNotification()
    const isNotNone = computed(() => option.notificationCycle !== 'none')

    const {
        confirmVisible, setConfirmVisible, granted, checkBeforeRequest, doRequest
    } = usePermission()

    const onCycleChange = (val: timer.notification.Cycle) => {
        const setVal = () => option.notificationCycle = val
        val === 'none'
            ? setVal()
            // need to check the permission
            : checkBeforeRequest(option.notificationMethod, setVal)
    }

    const onMethodChange = (val: timer.notification.Method) => checkBeforeRequest(val, () => option.notificationMethod = val)

    ctx.expose({
        reset,
    } satisfies CategoryInstance)

    return () => (
        <OptionLines>
            <OptionItem label={msg => msg.option.notification.cycle.label} defaultValue={msg => msg.option.off}>
                <ElSelect
                    modelValue={option.notificationCycle}
                    size="small"
                    style={{ width: "120px" } satisfies StyleValue}
                    onChange={val => onCycleChange(val as timer.notification.Cycle)}
                    options={Object.entries(CYCLE_LABELS).map(([value, label]) => ({ value: value as timer.notification.Cycle, label }))}
                />
                {option.notificationCycle === 'weekly' && <>
                    <ElSelect
                        modelValue={weekday.value}
                        size="small"
                        style={{ minWidth: "70px", width: "70px", ...PADDING } satisfies StyleValue}
                        onChange={val => weekday.value = val as number}
                        options={ALL_WEEKDAYS.map((label, idx) => ({ value: idx, label }))}
                    />
                    <span style={PADDING}>-</span>
                </>}
                {(option.notificationCycle === 'daily' || option.notificationCycle === 'weekly') && (
                    <ElTimePicker
                        modelValue={datetime.value}
                        size="small"
                        style={{ width: "80px", ...PADDING } satisfies StyleValue}
                        onUpdate:modelValue={val => datetime.value = val as Date}
                        format="HH:mm"
                        clearable={false}
                    />
                )}
            </OptionItem>
            <OptionItem v-show={isNotNone.value} label={msg => msg.option.notification.method.label}>
                <ElSelect
                    modelValue={option.notificationMethod}
                    size="small"
                    style={{ width: "150px" } satisfies StyleValue}
                    onChange={val => onMethodChange(val as timer.notification.Method)}
                    options={Object.entries(METHOD_LABELS).map(([value, label]) => ({ value: value as timer.notification.Method, label }))}
                />
            </OptionItem>
            {isNotNone.value && option.notificationMethod === 'callback' && (
                <>
                    <OptionItem label={msg => msg.option.notification.method.callback.url} required>
                        <ElInput
                            modelValue={option.notificationEndpoint || ''}
                            size="small"
                            style={{ width: "400px" } satisfies StyleValue}
                            onInput={val => option.notificationEndpoint = val}
                            placeholder="https://example.com/notification"
                        />
                    </OptionItem>
                    <OptionItem label="Security Token {input}">
                        <ElInput
                            modelValue={option.notificationAuthToken || ''}
                            size="small"
                            type="password"
                            showPassword={true}
                            style={{ width: "300px" } satisfies StyleValue}
                            onInput={val => option.notificationAuthToken = val}
                            placeholder="Optional"
                        />
                    </OptionItem>
                </>
            )}
            {isNotNone.value && <Footer />}
            <ElDialog
                width={400} closeOnPressEscape={false} closeOnClickModal={false}
                modelValue={confirmVisible.value}
                onUpdate:modelValue={setConfirmVisible}
            >
                <Flex column gap={20}>
                    <ElText size='large'>
                        {t(msg => msg.option.permGrantConfirm)}
                    </ElText>
                    <Flex justify='end'>
                        <ElButton onClick={() => setConfirmVisible(false)} icon={Close}>
                            {t(msg => msg.button.cancel)}
                        </ElButton>
                        <ElButton onClick={doRequest} icon={Check} type='primary'>
                            {t(msg => msg.button.confirm)}
                        </ElButton>
                    </Flex>
                </Flex>
            </ElDialog>
        </OptionLines>
    )
})

export default Notification
