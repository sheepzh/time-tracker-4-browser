/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { hasPerm, requestPerm } from "@api/chrome/permission"
import { isAllowedFileSchemeAccess, sendMsg2Runtime } from "@api/chrome/runtime"
import { t } from "@app/locale"
import { useManualRequest, useRequest } from "@hooks"
import { locale } from "@i18n"
import immigration from '@service/components/immigration'
import { rotate } from "@util/array"
import { IS_ANDROID, IS_FIREFOX } from "@util/constant/environment"
import { defaultTracking } from "@util/constant/option"
import { MILL_PER_SECOND } from "@util/time"
import { ElMessage, ElMessageBox, ElSelect, ElSwitch, ElTimePicker, ElTooltip } from "element-plus"
import { computed, defineComponent } from "vue"
import { type OptionInstance } from "../common"
import { useOption } from "../useOption"
import OptionItem from "./OptionItem"
import OptionLines from './OptionLines'
import OptionTag from './OptionTag'
import OptionTooltip from './OptionTooltip'

const ALL_STORAGES: Record<timer.option.StorageType, string> = {
    classic: 'chrome.storage.local',
    indexed_db: 'IndexedDB',
}

const DEFAULT_VALUE = defaultTracking()

const weekStartOptionPairs: [[timer.option.WeekStartOption, string]] = [
    ['default', t(msg => msg.option.tracking.weekStartAsNormal)]
]
const allWeekDays = t(msg => msg.calendar.weekDays)
    .split('|')
    .map((weekDay, idx) => [idx + 1, weekDay] as [timer.option.WeekStartOption, string])
rotate(allWeekDays, locale === 'zh_CN' ? 0 : 1, true)
allWeekDays.forEach(weekDayInfo => weekStartOptionPairs.push(weekDayInfo))

function copy(target: timer.option.TrackingOption, source: timer.option.TrackingOption) {
    target.countLocalFiles = source.countLocalFiles
    target.countTabGroup = source.countTabGroup
    target.weekStart = source.weekStart
    target.autoPauseTracking = source.autoPauseTracking
    target.autoPauseInterval = source.autoPauseInterval
    target.storage = source.storage
}

const _default = defineComponent((_props, ctx) => {
    const { option } = useOption({ defaultValue: defaultTracking, copy })
    const { data: fileAccess } = useRequest(isAllowedFileSchemeAccess)
    const reset = () => {
        // Not to reset these fields
        const {
            autoPauseInterval: oldInterval,
            storage: oldStorage,
        } = option
        copy(option, defaultTracking())
        option.autoPauseInterval = oldInterval
        option.storage = oldStorage
    }
    ctx.expose({ reset } satisfies OptionInstance)

    const { refresh: changeStorageType, loading: storageMigrating } = useManualRequest(async (type: timer.option.StorageType) => {
        await immigration.migrateStorage(type)
        option.storage = type
    }, { loadingText: 'Data migrating...' })

    const handleChangeStorage = (type: timer.option.StorageType) => {
        const msg = t(msg => msg.option.tracking.storageConfirm, { type: ALL_STORAGES[type] })
        ElMessageBox.confirm(msg, { type: 'warning' })
            .then(() => changeStorageType(type))
            .catch(() => ElMessage.info('Cancelled by user'))
    }

    const interval = computed<number>({
        get: _oldValue => {
            const intervalNum = option.autoPauseInterval
            const now = new Date()
            now.setHours(0)
            now.setMinutes(0)
            now.setSeconds(0)
            return now.getTime() + intervalNum * MILL_PER_SECOND
        },
        set: val => {
            const date = new Date(val)
            const interval = date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds()
            option.autoPauseInterval = Math.max(5, interval)
        },
    })

    const intervalFormat = computed(() => {
        const intervalNum = option.autoPauseInterval
        if (intervalNum >= 3600) return 'HH [hr] mm [min] ss [sec]'
        if (intervalNum >= 60) return 'mm [min] ss [sec]'
        return 'ss [sec]'
    })

    const handleTabGroupChange = async (val: boolean) => {
        if (val && !await hasPerm("tabGroups")) {
            try {
                const granted = await ElMessageBox.confirm(t(msg => msg.option.tracking.tabGroupsPermGrant), { type: 'primary' })
                    .then(() => requestPerm("tabGroups"))
                if (!granted) {
                    ElMessage.error("Grant permission failed")
                    return
                }
            } catch {
                return
            }
        }
        option.countTabGroup = val
        val && sendMsg2Runtime("enableTabGroup")
    }

    return () => <OptionLines>
        {!IS_ANDROID && <>
            <OptionItem
                label={msg => msg.option.tracking.autoPauseTrack}
                defaultValue={DEFAULT_VALUE.autoPauseTracking}
                v-slots={{
                    info: () => <OptionTooltip>{t(msg => msg.option.tracking.noActivityInfo)}</OptionTooltip>,
                    maxTime: () => <ElTimePicker
                        size="small"
                        clearable={false}
                        disabled={!option.autoPauseTracking}
                        format={intervalFormat.value}
                        modelValue={interval.value}
                        onUpdate:modelValue={val => interval.value = val}
                        style={{ width: '150px' }}
                    />,
                    default: () => <ElSwitch
                        modelValue={option.autoPauseTracking}
                        onChange={val => option.autoPauseTracking = val as boolean}
                    />
                }}
            />
            <OptionItem
                label={msg => msg.option.tracking.countLocalFiles}
                defaultValue={DEFAULT_VALUE.countLocalFiles}
                v-slots={{
                    info: () => <OptionTooltip>{t(msg => msg.option.tracking.localFilesInfo)}</OptionTooltip>,
                    localFileTime: () => <OptionTag>{t(msg => msg.option.tracking.localFileTime)}</OptionTag>,
                    default: () => fileAccess.value || IS_FIREFOX
                        ? <ElSwitch modelValue={option.countLocalFiles} onChange={val => option.countLocalFiles = !!val} />
                        : <ElTooltip
                            placement="top"
                            v-slots={{
                                content: () => t(msg => msg.option.tracking.fileAccessDisabled),
                                default: () => <ElSwitch modelValue={false} disabled />,
                            }}
                        />,
                }}
            />
            <OptionItem
                label={msg => msg.option.tracking.countTabGroup}
                defaultValue={t(msg => msg.option.no)}
                v-slots={{
                    info: () => <OptionTooltip>{t(msg => msg.option.tracking.tabGroupInfo)}</OptionTooltip>,
                    default: () => <ElSwitch modelValue={option.countTabGroup} onChange={val => handleTabGroupChange(!!val)} />
                }}
            />
        </>}
        <OptionItem
            label={msg => msg.option.tracking.weekStart}
            defaultValue={msg => msg.option.tracking.weekStartAsNormal}
        >
            <ElSelect
                modelValue={option.weekStart}
                size="small"
                style={{ width: '120px' }}
                onChange={(val: timer.option.WeekStartOption) => option.weekStart = val}
                options={weekStartOptionPairs.map(([value, label]) => ({ value, label }))}
            />
        </OptionItem>
        <OptionItem label={msg => msg.option.tracking.storage}>
            <ElSelect
                modelValue={option.storage}
                size="small"
                loading={storageMigrating.value}
                style={{ width: '160px' }}
                onChange={val => handleChangeStorage(val)}
                options={Object.entries(ALL_STORAGES).map(([value, label]) => ({ value, label }))}
            />
        </OptionItem>
    </OptionLines>
})

export default _default