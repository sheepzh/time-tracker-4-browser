/**
 * Copyright (c) 2022-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import {
    DEFAULT_VAULT as DEFAULT_OBSIDIAN_BUCKET,
    DEFAULT_ENDPOINT as DEFAULT_OBSIDIAN_ENDPOINT,
} from "@api/obsidian"
import { t } from "@app/locale"
import { ElInput, ElSelect } from "element-plus"
import { computed, defineComponent } from "vue"
import { OptionItem, OptionLines, OptionTooltip } from '../../components'
import type { CategoryInstance } from '../types'
import AutoInput from "./AutoInput"
import Footer from "./Footer"
import { useBackup } from "./useBackup"

const ALL_TYPES: timer.backup.Type[] = [
    'none',
    'gist',
    'web_dav',
    'obsidian_local_rest_api',
]

const TYPE_NAMES: Record<timer.backup.Type, string> = {
    none: t(msg => msg.option.off),
    gist: 'GitHub Gist',
    obsidian_local_rest_api: 'Obsidian - Local REST API',
    web_dav: 'WebDAV'
}

const LONG_INPUT_WIDTH = 'min(400px, calc(100vw - 80px))'

const _default = defineComponent((_, ctx) => {
    const {
        option, auth, account, password, reset,
        ext, setExtField,
    } = useBackup()

    const isNotNone = computed(() => option.backupType !== 'none')

    ctx.expose({ reset } satisfies CategoryInstance)

    return () => <OptionLines>
        <OptionItem label={msg => msg.option.backup.type} defaultValue={TYPE_NAMES['none']}>
            <ElSelect
                modelValue={option.backupType}
                size="small"
                onChange={(val: timer.backup.Type) => option.backupType = val}
                options={ALL_TYPES.map(value => ({ value, label: TYPE_NAMES[value] }))}
            />
        </OptionItem>
        {isNotNone.value && (
            <OptionItem label="{input}" defaultValue={false}>
                <AutoInput
                    autoBackup={option.autoBackUp}
                    interval={option.autoBackUpInterval}
                    onAutoBackupChange={val => option.autoBackUp = val}
                    onIntervalChange={val => val !== undefined && (option.autoBackUpInterval = val)}
                />
            </OptionItem>
        )}
        {option.backupType === 'gist' && (
            <OptionItem
                label="Personal Access Token {info} {input}"
                v-slots={{
                    info: () => <OptionTooltip>{t(msg => msg.option.backup.meta.gist.authInfo)}</OptionTooltip>
                }}
            >
                <ElInput
                    name='token'
                    modelValue={auth.value}
                    size="small"
                    type="password"
                    showPassword
                    style={{ width: LONG_INPUT_WIDTH }}
                    onInput={val => auth.value = val?.trim?.() || ''}
                />
            </OptionItem>
        )}
        {option.backupType === 'obsidian_local_rest_api' && <>
            <OptionItem
                label={msg => msg.option.backup.label.endpoint}
                v-slots={{
                    info: () => <OptionTooltip>{t(msg => msg.option.backup.meta.obsidian_local_rest_api.endpointInfo)}</OptionTooltip>
                }}
            >
                <ElInput
                    placeholder={DEFAULT_OBSIDIAN_ENDPOINT}
                    modelValue={ext.value?.endpoint}
                    size="small"
                    style={{ width: LONG_INPUT_WIDTH }}
                    onInput={val => setExtField('endpoint', val)}
                />
            </OptionItem>
            <OptionItem label="Vault Name {input}">
                <ElInput
                    placeholder={DEFAULT_OBSIDIAN_BUCKET}
                    modelValue={ext.value?.bucket}
                    size="small"
                    style={{ width: "200px" }}
                    onInput={val => setExtField('bucket', val)}
                />
            </OptionItem>
            <OptionItem label={msg => msg.option.backup.label.path} required>
                <ElInput
                    modelValue={ext.value?.dirPath}
                    size="small"
                    style={{ width: LONG_INPUT_WIDTH }}
                    onInput={val => setExtField('dirPath', val)}
                />
            </OptionItem>
            <OptionItem label="Authorization {input}" required>
                <ElInput
                    modelValue={auth.value}
                    size="small"
                    type="password"
                    showPassword
                    style={{ width: LONG_INPUT_WIDTH }}
                    onInput={val => auth.value = val?.trim?.() || ''}
                />
            </OptionItem>
        </>}
        {option.backupType === 'web_dav' && <>
            <OptionItem
                label={msg => msg.option.backup.label.endpoint}
                v-slots={{ info: () => '' }}
                required
            >
                <ElInput
                    modelValue={ext.value?.endpoint}
                    placeholder="https://for.example.com:443"
                    size="small"
                    style={{ width: LONG_INPUT_WIDTH }}
                    onInput={val => setExtField('endpoint', val)}
                />
            </OptionItem>
            <OptionItem label={msg => msg.option.backup.label.path} required>
                <ElInput
                    modelValue={ext.value?.dirPath}
                    placeholder="/for/example"
                    size="small"
                    style={{ width: LONG_INPUT_WIDTH }}
                    onInput={val => setExtField('dirPath', val)}
                />
            </OptionItem>
            <OptionItem label={msg => msg.option.backup.label.account} required>
                <ElInput
                    modelValue={account.value}
                    size="small"
                    style={{ width: "200px" }}
                    onInput={val => account.value = val?.trim?.()}
                />
            </OptionItem>
            <OptionItem label={msg => msg.option.backup.label.password} required>
                <ElInput
                    modelValue={password.value}
                    size="small"
                    showPassword
                    style={{ width: "300px" }}
                    onInput={val => password.value = val?.trim?.()}
                />
            </OptionItem>
        </>}
        {isNotNone.value && <>
            <OptionItem label={msg => msg.option.backup.client}>
                <ElInput
                    modelValue={option.clientName}
                    size="small"
                    style={{ width: "120px" }}
                    onInput={val => option.clientName = val?.trim?.() ?? ''}
                />
            </OptionItem>
            <Footer type={option.backupType} />
        </>}
    </OptionLines>
})

export default _default