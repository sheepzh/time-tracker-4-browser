import { useOption } from '@app/components/Option/useOption'
import { trySendMsg2Runtime } from '@api/sw/common'
import { defaultBackup } from "@util/constant/option"
import { computed, watch } from "vue"

function copy(target: timer.option.BackupOption, source: timer.option.BackupOption) {
    target.backupType = source.backupType
    target.autoBackUp = source.autoBackUp
    target.autoBackUpInterval = source.autoBackUpInterval
    target.backupExts = source.backupExts
    target.backupAuths = source.backupAuths
    target.clientName = source.clientName
    target.backupLogin = source.backupLogin
}

export const useBackup = () => {
    const { option, loading } = useOption({ defaultValue: defaultBackup, copy })

    watch([
        () => option.autoBackUp,
        () => option.autoBackUpInterval,
    ], () => !loading.value && setTimeout(() => trySendMsg2Runtime('resetBackupScheduler')))

    const reset = () => {
        const defaultOption = defaultBackup()
        // Only reset type and auto flag
        option.backupType = defaultOption.backupType
        option.autoBackUp = defaultOption.autoBackUp
    }

    const auth = computed({
        get: () => option.backupAuths[option.backupType],
        set: val => {
            const typeVal = option.backupType
            if (!typeVal) return
            const newAuths = {
                ...option.backupAuths,
                [typeVal]: val,
            }
            option.backupAuths = newAuths
        }
    })

    const ext = computed<timer.backup.TypeExt | undefined>({
        get: () => option.backupExts?.[option.backupType],
        set: val => {
            const typeVal = option.backupType
            if (!typeVal) return
            const newExts = {
                ...option.backupExts,
                [typeVal]: val,
            }
            option.backupExts = newExts
        },
    })

    const setExtField = (field: keyof timer.backup.TypeExt, val: string) => {
        const newVal = { ...(ext.value || {}), [field]: val?.trim?.() }
        ext.value = newVal
    }

    const setLoginField = (field: keyof timer.backup.LoginInfo, val: string) => {
        const typeVal = option.backupType
        if (!typeVal) return
        const newLogin = {
            ...option.backupLogin,
            [typeVal]: { ...option.backupLogin?.[typeVal], [field]: val }
        }
        option.backupLogin = newLogin
    }

    const account = computed<string | undefined>({
        get: () => option.backupLogin?.[option.backupType]?.acc,
        set: val => setLoginField('acc', val ?? '')
    })

    const password = computed<string | undefined>({
        get: () => option.backupLogin?.[option.backupType]?.psw,
        set: val => setLoginField('psw', val ?? '')
    })

    return {
        option, auth, account, password, reset,
        ext, setExtField,
    }
}
