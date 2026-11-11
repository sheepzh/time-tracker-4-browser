/**
 * Copyright (c) 2021-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { getOption } from '@api/sw/option'
import { Lock } from '@element-plus/icons-vue'
import { css } from '@emotion/css'
import { useDocumentVisibility } from '@hooks'
import { fmtHourMinute, t as t_, tN, type I18nKey } from '@i18n'
import sharedMessages, { type SharedMessage } from '@i18n/message/common/shared'
import { MILL_PER_MINUTE } from '@util/time'
import { ElButton, ElIcon, ElMessage, ElMessageBox, ElSelect, ElText, useNamespace } from 'element-plus'
import { computed, defineComponent, inject, onBeforeUnmount, ref, watch } from 'vue'
import { routerViewLocationKey } from 'vue-router'
import Flex from './Flex'

const NAMESPACE = 'data-lock'
const EXPIRE_KEY = `${NAMESPACE}-expire`

const readExpire = (): number | undefined => {
    const raw = localStorage.getItem(EXPIRE_KEY)
    if (!raw) return undefined
    try {
        const val = JSON.parse(raw)
        return typeof val === 'number' ? val : undefined
    } catch {
        return undefined
    }
}

const passed = ref<boolean>()

let timer: ReturnType<typeof setTimeout> | undefined
let checkStamp = 0

const stopTimer = () => {
    if (timer === undefined) return
    clearTimeout(timer)
    timer = undefined
}

const passUntil = (deadline: number): void => {
    passed.value = true
    stopTimer()
    timer = setTimeout(() => check(), Math.max(deadline - Date.now(), 0) + 1000)
}

const check = async (): Promise<void> => {
    const stamp = ++checkStamp
    stopTimer()
    const expireVal = readExpire()
    if (expireVal && expireVal > Date.now()) return passUntil(expireVal)
    try {
        const { dataPassword } = await getOption()
        if (stamp !== checkStamp) return
        passed.value = !dataPassword
    } catch {
        if (stamp !== checkStamp) return
        passed.value = false
    }
}

const unlock = async (inPsw: string, minutes: number) => {
    ++checkStamp
    const { dataPassword } = await getOption()
    if (!dataPassword) return passed.value = true
    if (dataPassword !== inPsw) return false
    const deadline = Date.now() + minutes * MILL_PER_MINUTE
    localStorage.setItem(EXPIRE_KEY, JSON.stringify(deadline))
    passUntil(deadline)
    return true
}

export const releaseLock = () => {
    ++checkStamp
    stopTimer()
    passed.value = false
    localStorage.removeItem(EXPIRE_KEY)
}

const useDataLock = () => {
    const visibility = useDocumentVisibility()
    watch(visibility, () => {
        if (visibility.value !== 'visible' || !passed.value) return
        const expireVal = readExpire()
        if (expireVal && expireVal > Date.now()) return
        check()
    })
    onBeforeUnmount(stopTimer)
    return { passed, check, unlock }
}

const t = (key: I18nKey<SharedMessage>) => t_(sharedMessages, { key })

const DEFAULT_DURATION = 5
const MINUTE_PER_HOUR = 60

const DURATIONS: number[] = [
    DEFAULT_DURATION, 30, MINUTE_PER_HOUR * 2, MINUTE_PER_HOUR * 24,
]

const INPUT_NS = useNamespace('input')
const MODAL_CLS = css`
    & .${INPUT_NS.e('inner')} {
        background: 0;
    }
`

const DataLock = defineComponent<{}>((_, { slots }) => {
    const { passed, check, unlock } = useDataLock()
    const duration = ref(DEFAULT_DURATION)

    const route = inject(routerViewLocationKey, undefined)
    const enabled = computed(() => !route || !route.value.meta.noData)

    watch(enabled, val => val && check(), { immediate: true })

    const verify = () => !passed.value && ElMessageBox({
        boxType: 'prompt',
        autofocus: true,
        showCancelButton: true,
        showClose: false,
        closeOnClickModal: false,
        buttonSize: 'small',
        confirmButtonText: t(msg => msg.dataLock.unlock),
        showInput: true,
        inputType: "password",
        modalClass: MODAL_CLS,
        message: () => (
            <Flex gap={4} align='center'>
                {tN(sharedMessages, {
                    key: msg => msg.dataLock.durationLabel,
                    param: <ElSelect
                        modelValue={duration.value}
                        style={{ width: '130px' }}
                        onChange={val => duration.value = val}
                        options={DURATIONS.map(value => ({ value, label: fmtHourMinute(value) }))}
                    />,
                })}
            </Flex>
        ),
        beforeClose: (action, instance, done) => {
            if (action !== 'confirm') return done()
            unlock(instance.inputValue, duration.value)
                .then(ok => {
                    if (!ok) return ElMessage.error(t(msg => msg.incorrectPassword))
                    done()
                })
                .catch(() => ElMessage.error(t(msg => msg.incorrectPassword)))
        },
    }).catch(() => { })

    return () => {
        if (!enabled.value) return slots.default?.()
        if (passed.value === undefined) return null
        return (
            <Flex column position="relative" width="100%" height="100%">
                {passed.value ? slots.default?.() : (
                    <Flex column align="center" justify="center" gap={14} height="100%">
                        <ElIcon size={36} color="var(--el-text-color-secondary)"><Lock /></ElIcon>
                        <ElText type="info" size="small">{t(msg => msg.dataLock.tip)}</ElText>
                        <ElButton size="small" onClick={verify}>{t(msg => msg.dataLock.unlock)}</ElButton>
                    </Flex>
                )}
            </Flex>
        )
    }
})

export default DataLock
