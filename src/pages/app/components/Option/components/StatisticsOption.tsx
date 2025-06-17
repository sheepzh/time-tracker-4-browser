/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { hasPerm, requestPerm } from "@api/chrome/permission"
import { isAllowedFileSchemeAccess, sendMsg2Runtime } from "@api/chrome/runtime"
import { t } from "@app/locale"
import { useRequest } from "@hooks"
import { locale } from "@i18n"
import { rotate } from "@util/array"
import { IS_ANDROID, IS_FIREFOX } from "@util/constant/environment"
import { defaultStatistics } from "@util/constant/option"
import { MILL_PER_SECOND } from "@util/time"
import { ElMessage, ElMessageBox, ElOption, ElSelect, ElSwitch, ElTimePicker, ElTooltip } from "element-plus"
import { computed, defineComponent } from "vue"
import { type OptionInstance } from "../common"
import { useOption } from "../useOption"
import OptionItem from "./OptionItem"
import OptionTag from "./OptionTag"
import OptionTooltip from "./OptionTooltip"

const weekStartOptionPairs: [[timer.option.WeekStartOption, string]] = [
    ['default', t(msg => msg.option.statistics.weekStartAsNormal)]
]
const allWeekDays = t(msg => msg.calendar.weekDays)
    .split('|')
    .map((weekDay, idx) => [idx + 1, weekDay] as [timer.option.WeekStartOption, string])
rotate(allWeekDays, locale === 'zh_CN' ? 0 : 1, true)
allWeekDays.forEach(weekDayInfo => weekStartOptionPairs.push(weekDayInfo))

function copy(target: timer.option.StatisticsOption, source: timer.option.StatisticsOption) {
    target.collectSiteName = source.collectSiteName
    target.countLocalFiles = source.countLocalFiles
    target.countTabGroup = source.countTabGroup
    target.weekStart = source.weekStart
    target.autoPauseTracking = source.autoPauseTracking
    target.autoPauseInterval = source.autoPauseInterval
}

const _default = defineComponent((_props, ctx) => {
    const { option } = useOption({ defaultValue: defaultStatistics, copy })
    const { data: fileAccess } = useRequest(isAllowedFileSchemeAccess)
    ctx.expose({
        reset: () => {
            const oldInterval = option.autoPauseInterval
            copy(option, defaultStatistics())
            option.autoPauseInterval = oldInterval
        }
    } satisfies OptionInstance)

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
                const granted = await ElMessageBox.confirm(t(msg => msg.option.statistics.tabGroupsPermGrant), { type: 'primary' })
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

    return () => <>
        {!IS_ANDROID && <>
            <OptionItem
                label={msg => msg.option.statistics.autoPauseTrack}
                defaultValue={t(msg => msg.option.no)}
                hideDivider
                v-slots={{
                    info: () => <OptionTooltip>{t(msg => msg.option.statistics.noActivityInfo)}</OptionTooltip>,
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
                label={msg => msg.option.statistics.collectSiteName}
                defaultValue={t(msg => msg.option.yes)}
                v-slots={{
                    siteName: () => <OptionTag>{t(msg => msg.option.statistics.siteName)}</OptionTag>,
                    siteNameUsage: () => <OptionTooltip>{t(msg => msg.option.statistics.siteNameUsage)}</OptionTooltip>,
                    default: () => <ElSwitch
                        modelValue={option.collectSiteName}
                        onChange={val => option.collectSiteName = val as boolean}
                    />
                }}
            />
            <OptionItem
                label={msg => msg.option.statistics.countLocalFiles}
                defaultValue={fileAccess.value ? t(msg => msg.option.yes) : undefined}
                v-slots={{
                    info: () => <OptionTooltip>{t(msg => msg.option.statistics.localFilesInfo)}</OptionTooltip>,
                    localFileTime: () => <OptionTag>{t(msg => msg.option.statistics.localFileTime)}</OptionTag>,
                    default: () => fileAccess.value
                        ? <ElSwitch modelValue={option.countLocalFiles} onChange={val => option.countLocalFiles = val as boolean} />
                        : <ElTooltip
                            placement="top"
                            v-slots={{
                                content: () => IS_FIREFOX ? t(msg => msg.option.statistics.fileAccessFirefox) : t(msg => msg.option.statistics.fileAccessDisabled),
                                default: () => <ElSwitch modelValue={false} disabled />,
                            }}
                        />,
                }}
            />
            <OptionItem
                label={msg => msg.option.statistics.countTabGroup}
                defaultValue={t(msg => msg.option.no)}
                v-slots={{
                    info: () => <OptionTooltip>{t(msg => msg.option.statistics.tabGroupInfo)}</OptionTooltip>,
                    default: () => <ElSwitch modelValue={option.countTabGroup} onChange={val => handleTabGroupChange(!!val)} />
                }}
            />
        </>}
        <OptionItem
            hideDivider={IS_ANDROID}
            label={msg => msg.option.statistics.weekStart}
            defaultValue={t(msg => msg.option.statistics.weekStartAsNormal)}
        >
            <ElSelect
                modelValue={option.weekStart}
                size="small"
                style={{ width: '120px' }}
                onChange={(val: timer.option.WeekStartOption) => option.weekStart = val}
            >
                {weekStartOptionPairs.map(([val, label]) => <ElOption value={val} label={label} />)}
            </ElSelect>
        </OptionItem>
    </>
})

export default _default