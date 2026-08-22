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
import { OptionItem, OptionLines, OptionTooltip } from '@app/components/Option/components'
import { t } from '@app/locale'
import { Remove } from '@element-plus/icons-vue'
import Flex from '@pages/components/Flex'
import { GitHub } from '@pages/icons'
import { ElIcon, ElInput, ElOption, ElSelect } from "element-plus"
import { Component, computed, defineComponent, type FunctionalComponent, h } from "vue"
import type { CategoryInstance } from '../../types'
import AutoInput from "./AutoInput"
import Footer from "./Footer"
import { useBackup } from "./useBackup"

type Config = {
    name: string
    icon: Component
}

const CONFIGS: Record<tt4b.backup.Type, Config> = {
    none: {
        name: t(msg => msg.option.off),
        icon: Remove,
    },
    gist: {
        name: 'GitHub Gist',
        icon: GitHub,
    },
    obsidian_local_rest_api: {
        name: 'Obsidian - Local REST API',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                <polygon fill="#5c6bc0" points="9.464,21.643 14.964,9.071 28.321,3.155 37.5,11.736 34.25,37.185 31.096,45.118 17.321,42.071" />
                <polygon fill="#e8eaf6" points="38.536,12.214 28.321,7.5 28.321,2" />
                <polygon fill="#c5cae9" points="28.321,7.5 19.679,16.143 31.443,46 35.393,37.357 38.536,12.214" />
                <polygon fill="#9fa8da" points="28.321,7.5 19.679,16.143 14.964,9.071 28.321,2" />
                <polygon fill="#7986cb" points="17.321,42.071 19.679,16.143 31.443,46" />
            </svg>
        ),
    },
    web_dav: {
        name: 'WebDAV',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                <path fill="#455A64" d="M27.313 14.186c-.171-.507 0-1.184 0-1.184h-6.287c0 0 .339.677.169 1.184 0 .508-5.434 20.813-5.434 20.813h4.246l1.188-4.398h5.778l1.018 4.398h5.777C33.939 34.999 27.313 14.693 27.313 14.186zM21.705 27.386l2.379-6.938 2.211 6.938H21.705zM27.821 13.002h6.458l3.567 14.892c0 0 3.906-13.2 4.076-13.708 0-.507-.51-1.184-.51-1.184H46c0 0-.34 1.015-.34 1.184 0 .339-5.438 16.754-5.438 16.754s-.51 1.353-.51 2.029c0 .68.678 1.862.678 1.862h-5.773c0 0 0-.846 0-1.183 0-.341-5.947-18.955-6.116-19.463C28.331 13.34 27.821 13.002 27.821 13.002z" />
                <path fill="#455A64" d="M15.082,13.002c1.697,0-7.987,0-7.987,0s0.17,0.677,0,1.353c-0.17,0.68-3.228,14.384-4.416,19.294C2.509,34.493,2,34.999,2,34.999s3.229,0,8.832,0c5.607,0,10.703-7.105,10.703-14.721C21.535,12.665,14.4,13.002,15.082,13.002z M10.832,31.784c-2.546,0-2.546,0-2.546,0l3.908-15.565c0,0,1.188,0,1.695,0c0.511,0,2.89,0.168,2.89,4.736S13.382,31.784,10.832,31.784z" />
            </svg>
        ),
    },
}

const Item: FunctionalComponent<{ value: tt4b.backup.Type }> = ({ value }) => (
    <Flex align='center' gap={4}>
        <ElIcon>{h(CONFIGS[value].icon)}</ElIcon>
        {CONFIGS[value].name}
    </Flex>
)

const ALL_TYPES: tt4b.backup.Type[] = [
    'none',
    'gist',
    'web_dav',
    'obsidian_local_rest_api',
]

const LONG_INPUT_WIDTH = 'min(400px, calc(100vw - 80px))'

const _default = defineComponent((_, ctx) => {
    const {
        option, auth, account, password, reset,
        ext, setExtField,
    } = useBackup()

    const isNotNone = computed(() => option.backupType !== 'none')

    ctx.expose({ reset } satisfies CategoryInstance)

    return () => <OptionLines>
        <OptionItem label={msg => msg.option.backup.type} defaultValue={CONFIGS['none'].name}>
            <ElSelect
                modelValue={option.backupType}
                size="small"
                style={{ width: '220px' }}
                onChange={(val: tt4b.backup.Type) => option.backupType = val}
                v-slots={{
                    default: () => ALL_TYPES.map(v => <ElOption value={v}><Item value={v} /></ElOption>),
                    label: () => <Item value={option.backupType} />,
                }}
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
                label='Personal Access Token {info} {input}'
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