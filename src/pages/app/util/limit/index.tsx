import { sendMsg2Runtime, trySendMsg2Runtime } from '@api/sw/common'
import { css } from '@emotion/css'
import { useCountDown } from "@hooks"
import { type I18nKey, type I18nResultItem, locale, t as t_, tN as tN_ } from "@i18n"
import limitMessages, { type LimitMessage } from "@i18n/message/app/limit"
import buttonMessages from "@i18n/message/common/button"
import { getCssVariable } from "@pages/util/style"
import { dateMinute2Idx, hasLimited, isEffective } from "@util/limit"
import { ElMessage, ElMessageBox, type InputType, useId, useNamespace } from "element-plus"
import { defineComponent, onMounted, ref, type VNode } from "vue"
import verificationProcessor from './processor'

const t = (key: I18nKey<LimitMessage>, param?: any) => t_(limitMessages, { key, param })

const tN = (key: I18nKey<LimitMessage>, param?: any) => tN_<LimitMessage, VNode>(limitMessages, { key, param })

/**
 * Judge wether verification is required
 *
 * @returns T/F
 */
export async function judgeVerificationRequired(item: timer.limit.Item, delayDuration: number): Promise<boolean> {
    if (item.locked) return true
    if (!item.enabled || !isEffective(item.weekdays)) return false

    const { visitTime, periods } = item
    // Daily or weekly
    if (hasLimited(item, delayDuration)) return true
    // Period
    if (periods?.length) {
        const idx = dateMinute2Idx(new Date())
        const hitPeriod = periods?.some(([s, e]) => s <= idx && e >= idx)
        if (hitPeriod) return true
    }
    // Visit
    if (visitTime) {
        // If error occurs, regarded as not hitting
        const hitVisit = await trySendMsg2Runtime('limit.hitVisit', item) ?? false
        if (hitVisit) return true
    }
    return false
}


const ANSWER_CANVAS_FONT_SIZE = 24

const AnswerCanvas = defineComponent(((props: { text: string }) => {
    const dom = ref<HTMLCanvasElement>()
    const wrapper = ref<HTMLDivElement>()
    const { text } = props

    onMounted(() => {
        const ele = dom.value
        if (!ele) return
        const ctx = ele.getContext("2d")
        const height = Math.floor(ANSWER_CANVAS_FONT_SIZE * 1.3)
        ele.height = height
        const wrapperEl = wrapper.value
        if (!wrapperEl || !ctx) return
        const font = getComputedStyle(wrapperEl).font
        // Set font to measure width
        ctx.font = font
        const { width } = ctx.measureText(text)
        ele.width = width
        // Need set font again after width changed
        ctx.font = font
        const color = getCssVariable("--el-text-color-primary")
        color && (ctx.fillStyle = color)
        ctx.fillText(text, 0, ANSWER_CANVAS_FONT_SIZE)
    })

    return () => (
        <div
            style={{
                fontSize: `${ANSWER_CANVAS_FONT_SIZE}px`,
                textAlign: 'center'
            }}
            ref={wrapper}
        >
            <canvas ref={dom} />
        </div>
    )
}), { props: ['text'] })

// Fix some style missing in limit modal with postcss processor
const INPUT_NS = useNamespace('input')
const MODAL_CLS = css`
    & .${INPUT_NS.e('inner')} {
        background: 0;
    }
`
const MSG_CLS = css`
    left: 50%;
    transform: translate(-50%);
`
const okBtnTxt = t_(buttonMessages, { key: msg => msg.okay })

const errMsg = (message: string) => ElMessage.error({ message, customClass: MSG_CLS })

/**
 * NOT TO return Promise.resolve()
 *
 * NOT TO use async
 *
 * @returns null if verification not required,
 *          or promise with resolve invoked only if verification code or password correct
 */
export function processVerification(option: timer.option.LimitOption): Promise<void> {
    const { limitLevel, limitPassword, limitVerifyDifficulty } = option
    if (limitLevel === 'strict') {
        return new Promise(() => ElMessageBox({
            boxType: 'alert',
            type: 'warning',
            title: '',
            message: <div>{t(msg => msg.verification.strictTip)}</div>,
        }).catch(() => { }))
    } else if (limitLevel === '2fa') {
        return process2faVerification()
    }
    let inputType: InputType | undefined
    let answerValue: string | undefined
    let messageNode: I18nResultItem<VNode>[] | undefined | I18nResultItem<VNode>
    let incorrectMessage: string
    let countdown: number | undefined
    if (limitLevel === 'password' && limitPassword) {
        answerValue = limitPassword
        messageNode = t(msg => msg.verification.pswInputTip)
        incorrectMessage = t(msg => msg.verification.incorrectPsw)
        inputType = 'password'
    } else if (limitLevel === 'verification') {
        const pair = verificationProcessor.generate(limitVerifyDifficulty ?? 'easy', locale)
        const { prompt, promptParam, answer, second = 60 } = pair ?? {}
        countdown = second
        answerValue = typeof answer === 'function' ? t(msg => (answer as (msg: any) => string)(msg.verification)) : answer
        incorrectMessage = t(msg => msg.verification.incorrectAnswer)
        if (prompt) {
            const promptTxt = typeof prompt === 'function'
                ? t(msg => prompt(msg.verification), { ...promptParam, answer: answerValue })
                : prompt
            messageNode = tN(msg => msg.verification.inputTip, { prompt: <b>{promptTxt}</b>, second })
        } else if (answerValue) {
            messageNode = tN(msg => msg.verification.inputTip2, { answer: <AnswerCanvas text={answerValue} />, second })
        }
    }
    if (!messageNode || !answerValue) return Promise.resolve()

    const okBtnClz = `limit-confirm-btn-${useId().value}`
    const btnText = (leftSec: number) => `${okBtnTxt} (${leftSec})`

    const msgData = ElMessageBox({
        autofocus: true,
        boxType: 'prompt',
        type: 'warning',
        message: <div style={{ userSelect: 'none' }}>{messageNode}</div>,
        showInput: true,
        inputType,
        showCancelButton: true,
        showClose: false,
        confirmButtonText: countdown ? btnText(countdown) : okBtnTxt,
        confirmButtonClass: okBtnClz,
        buttonSize: "small",
        modalClass: MODAL_CLS,
    })

    const cleanCountdown = countdown ? useCountDown({
        countdown,
        onComplete: () => {
            const btn = document.querySelector(`.${okBtnClz}`)
            if (!btn) return
            ElMessage.warning(t(msg => msg.message.timeout))
            btn.remove()
        },
        onTick: (val: number) => {
            const btnSpan = document.querySelector(`.${okBtnClz} span`)
            if (!btnSpan) return
            btnSpan.textContent = btnText(Math.floor(val / 1000))
        },
    }) : undefined

    return new Promise(resolve => {
        msgData.then(data => {
            // Double check
            const btn = document.querySelector(`.${okBtnClz}`)
            if (!btn) return
            if (typeof data === 'string') return
            const { value } = data
            if (value === answerValue) return resolve()
            errMsg(incorrectMessage)
        }).catch(() => cleanCountdown?.())
    })
}

function process2faVerification(): Promise<void> {
    return new Promise(resolve => ElMessageBox({
        autofocus: true,
        boxType: 'prompt',
        type: 'warning',
        message: t(msg => msg.verification.twoFaInputTip),
        showInput: true,
        showCancelButton: true,
        showClose: false,
        confirmButtonText: okBtnTxt,
        buttonSize: 'small',
        modalClass: MODAL_CLS,
        beforeClose: (act, instance, done) => {
            if (act !== 'confirm') return done()
            const code = instance.inputValue.replace(/\s/g, '')
            if (!/^\d{6}$/.test(code)) return errMsg('Invalid code format')
            sendMsg2Runtime('meta.check2fa', code)
                .then(ok => { if (!ok) throw new Error('Incorrect code') })
                .then(() => {
                    resolve()
                    done()
                })
                .catch(e => errMsg(e instanceof Error ? e.message : e ?? 'Unknown error'))
        },
    }))
}
