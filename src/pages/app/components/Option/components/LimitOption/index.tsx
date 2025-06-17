/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { t } from "@app/locale"
import { processVerification } from "@app/util/limit"
import { Edit } from "@element-plus/icons-vue"
import { defaultDailyLimit } from "@util/constant/option"
import { ElButton, ElInput, ElInputNumber, ElMessage, ElMessageBox, ElOption, ElSelect, ElSwitch } from "element-plus"
import { defineComponent, type StyleValue } from "vue"
import { type OptionInstance } from "../../common"
import { useOption } from "../../useOption"
import OptionItem from "../OptionItem"
import "./limit-option.sass"
import { usePswEdit } from "./usePswEdit"
import { useVerify } from "./useVerify"

const ALL_LEVEL: timer.limit.RestrictionLevel[] = [
    'nothing',
    'verification',
    'password',
    'strict',
]

const ALL_DIFF: timer.limit.VerificationDifficulty[] = [
    'easy',
    'hard',
    'disgusting',
]

function copy(target: timer.option.LimitOption, source: timer.option.LimitOption) {
    target.limitPrompt = source.limitPrompt
    target.limitLevel = source.limitLevel
    target.limitPassword = source.limitPassword
    target.limitVerifyDifficulty = source.limitVerifyDifficulty
    target.limitReminder = source.limitReminder
    target.limitReminderDuration = source.limitReminderDuration
}

function reset(target: timer.option.LimitOption) {
    const defaultValue: MakeOptional<timer.option.LimitOption, 'limitPassword' | 'limitVerifyDifficulty' | 'limitReminderDuration'> = defaultDailyLimit()
    // Not to reset limitPassword
    delete defaultValue.limitPassword
    // Not to reset difficulty
    delete defaultValue.limitVerifyDifficulty
    // Not to reset notification duration
    delete defaultValue.limitReminderDuration
    Object.entries(defaultValue).forEach(([key, val]) => (target as any)[key] = val)
}

const confirm4Strict = async (): Promise<void> => {
    const title = t(msg => msg.option.dailyLimit.level.strictTitle)
    const content = t(msg => msg.option.dailyLimit.level.strictContent)
    await ElMessageBox.confirm(content, title, {
        type: "warning",
        confirmButtonText: t(msg => msg.button.confirm),
        cancelButtonText: t(msg => msg.button.cancel),
    })
}

const _default = defineComponent((_, ctx) => {
    const { option } = useOption<timer.option.LimitOption>({ defaultValue: defaultDailyLimit, copy })
    const { verified, verify } = useVerify(option)
    const { modifyPsw } = usePswEdit({ reset: () => option.limitPassword })

    ctx.expose({
        reset: () => verify().then(() => reset(option)).catch(() => { })
    } satisfies OptionInstance)

    const handleLevelChange = async (val: timer.limit.RestrictionLevel) => {
        try {
            await verify()
            if (val === "strict") {
                await confirm4Strict()
            } else if (val === "password") {
                option.limitPassword = await modifyPsw()
            }
            option.limitLevel = val
        } catch (e) {
            console.log("Failed to verify", e)
        }
    }

    const handlePswEdit = async () => {
        try {
            await verify()
            option.limitPassword = await modifyPsw()
            ElMessage.success(t(msg => msg.operation.successMsg))
        } catch (e) {
            console.log("Failed to verify", e)
        }
    }

    return () => <>
        <OptionItem
            hideDivider
            label={msg => msg.option.dailyLimit.reminder}
            defaultValue={t(msg => msg.option.no)}
            v-slots={{
                default: () => (
                    <ElSwitch
                        modelValue={option.limitReminder}
                        onChange={val => option.limitReminder = val as boolean}
                    />
                ),
                minInput: () => (
                    <ElInputNumber
                        disabled={!option.limitReminder}
                        modelValue={option.limitReminderDuration}
                        onChange={val => val && (option.limitReminderDuration = val)}
                        min={1} max={20}
                        size="small"
                    />
                ),
            }}
        />
        <OptionItem
            label={msg => msg.option.dailyLimit.level.label}
            defaultValue={t(msg => msg.option.dailyLimit.level[defaultDailyLimit().limitLevel])}
        >
            <ElSelect
                modelValue={option.limitLevel}
                size="small"
                class='option-daily-limit-level-select'
                onChange={handleLevelChange}
            >
                {ALL_LEVEL.map(item => <ElOption value={item} label={t(msg => msg.option.dailyLimit.level[item])} />)}
            </ElSelect>
        </OptionItem>
        <OptionItem
            v-show={option.limitLevel === "password"}
            label={msg => msg.option.dailyLimit.level.passwordLabel}
        >
            <ElInput
                modelValue={option.limitPassword}
                size="small"
                type="password"
                showPassword={verified.value}
                style={{ width: "300px" }}
                v-slots={{
                    append: () => <ElButton icon={Edit} onClick={handlePswEdit} />,
                }}
            />
        </OptionItem>
        <OptionItem
            v-show={option.limitLevel === "verification"}
            label={msg => msg.option.dailyLimit.level.verificationLabel}
            defaultValue={t(msg => (msg.option.dailyLimit.level as any)[defaultDailyLimit().limitVerifyDifficulty])}
        >
            <ElSelect
                modelValue={option.limitVerifyDifficulty}
                size="small"
                onChange={(val: timer.limit.VerificationDifficulty) => verify()
                    .then(() => option.limitVerifyDifficulty = val)
                    .catch(console.log)
                }
            >
                {ALL_DIFF.map(item => <ElOption value={item} label={t(msg => msg.option.dailyLimit.level.verificationDifficulty[item])} />)}
            </ElSelect>
            <ElButton
                size="small"
                style={{ height: '28px', marginInlineStart: '5px' } satisfies StyleValue}
                onClick={() => processVerification(option)}
            >
                {t(msg => msg.button.test)}
            </ElButton>
        </OptionItem>
        <OptionItem label={msg => msg.option.dailyLimit.prompt}>
            <ElInput
                modelValue={option.limitPrompt}
                size="small"
                onInput={val => option.limitPrompt = val}
                placeholder={t(msg => msg.limitModal.defaultPrompt)}
                style={{ width: "280px" }}
            />
        </OptionItem>
    </>
})

export default _default