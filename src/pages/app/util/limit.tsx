import { sendMsg2Runtime } from "@api/chrome/runtime"
import { t, tN } from "@app/locale"
import { useCountDown } from '@hooks/useCount'
import { I18nResultItem, locale } from "@i18n"
import { getCssVariable } from "@pages/util/style"
import verificationProcessor from "@service/limit-service/verification/processor"
import { dateMinute2Idx, hasLimited, isEnabledAndEffective } from "@util/limit"
import { ElMessage, ElMessageBox, type ElMessageBoxOptions, type InputType, useId } from "element-plus"
import { defineComponent, onMounted, ref, type VNode } from "vue"

/**
 * Judge wether verification is required
 *
 * @returns T/F
 */
export async function judgeVerificationRequired(item: timer.limit.Item): Promise<boolean> {
    if (item.locked) return true
    if (!isEnabledAndEffective(item)) return false

    const { visitTime, periods } = item
    // Daily or weekly
    if (hasLimited(item)) return true
    // Period
    if (periods?.length) {
        const idx = dateMinute2Idx(new Date())
        const hitPeriod = periods?.some(([s, e]) => s <= idx && e >= idx)
        if (hitPeriod) return true
    }
    // Visit
    if (visitTime) {
        let hitVisit = false
        try {
            hitVisit = !!await sendMsg2Runtime("askHitVisit", item)
        } catch (e) {
            // If error occurs, regarded as not hitting
            // ignored
        }
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

/**
 * NOT TO return Promise.resolve()
 *
 * NOT TO use async
 *
 * @returns null if verification not required,
 *          or promise with resolve invoked only if verification code or password correct
 */
export function processVerification(option: timer.option.LimitOption, context?: { appendTo: Exclude<ElMessageBoxOptions['appendTo'], string> }): Promise<void> {
    const { limitLevel, limitPassword, limitVerifyDifficulty } = option
    const { appendTo } = context || {}
    if (limitLevel === "strict") {
        return new Promise(() => ElMessageBox({
            appendTo,
            boxType: 'alert',
            type: 'warning',
            title: '',
            message: <div>{t(msg => msg.limit.verification.strictTip)}</div>,
        }).catch(() => { }))
    }
    let inputType: InputType | undefined
    let answerValue: string | undefined
    let messageNode: I18nResultItem<VNode>[] | undefined | I18nResultItem<VNode>
    let incorrectMessage: string
    let countdown: number | undefined
    if (limitLevel === 'password' && limitPassword) {
        answerValue = limitPassword
        messageNode = t(msg => msg.limit.verification.pswInputTip)
        incorrectMessage = t(msg => msg.limit.verification.incorrectPsw)
        inputType = 'password'
    } else if (limitLevel === 'verification') {
        const pair = verificationProcessor.generate(limitVerifyDifficulty ?? 'easy', locale)
        const { prompt, promptParam, answer, second = 60 } = pair || {}
        countdown = second
        answerValue = typeof answer === 'function' ? t(msg => answer(msg.limit.verification)) : answer
        incorrectMessage = t(msg => msg.limit.verification.incorrectAnswer)
        if (prompt) {
            const promptTxt = typeof prompt === 'function'
                ? t(msg => prompt(msg.limit.verification), { ...promptParam, answer: answerValue })
                : prompt
            messageNode = tN(msg => msg.limit.verification.inputTip, { prompt: <b>{promptTxt}</b>, second })
        } else if (answerValue) {
            messageNode = tN(msg => msg.limit.verification.inputTip2, { answer: <AnswerCanvas text={answerValue} />, second })
        }
    }
    if (!messageNode || !answerValue) return Promise.resolve()

    const okBtnClz = `limit-confirm-btn-${useId().value}`
    const btnText = (leftSec: number) => `${okBtnTxt} (${leftSec})`

    const okBtnTxt = t(msg => msg.button.okey)
    const msgData = ElMessageBox({
        appendTo,
        autofocus: true,
        boxType: 'prompt',
        type: 'warning',
        title: '',
        message: <div style={{ userSelect: 'none' }}>{messageNode}</div>,
        showInput: true,
        inputType,
        showCancelButton: true,
        showClose: false,
        confirmButtonText: countdown ? btnText(countdown) : okBtnTxt,
        confirmButtonClass: okBtnClz,
        buttonSize: "small",
    })

    let cleanCountdown = countdown ? useCountDown({
        countdown,
        onComplete: () => {
            const btn = (appendTo ?? document).querySelector(`.${okBtnClz}`)
            if (!btn) return
            ElMessage.warning(t(msg => msg.limit.message.timeout))
            btn.remove()
        },
        onTick: (val: number) => {
            const btnSpan = (appendTo ?? document).querySelector(`.${okBtnClz} span`)
            if (!btnSpan) return
            btnSpan.textContent = btnText(Math.floor(val / 1000))
        },
    }) : undefined

    return new Promise(resolve => {
        msgData.then(data => {
            // Double check
            const btn = (appendTo ?? document).querySelector(`.${okBtnClz}`)
            if (!btn) return
            if (typeof data === 'string') return
            const { value } = data
            if (value === answerValue) return resolve()
            ElMessage.error({ appendTo, message: incorrectMessage })
        }).catch(() => cleanCountdown?.())
    })
}
