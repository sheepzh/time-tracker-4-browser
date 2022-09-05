/**
 * Copyright (c) 2022-present Hengyang Zhang
 * 
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import type { Ref } from "vue"

import { t } from "@app/locale"
import optionService from "@service/option-service"
import processor from "@src/background/backup/processor"
import { defaultBackup } from "@util/constant/option"
import { ElInput, ElOption, ElSelect, ElDivider, ElAlert, ElButton, ElMessage, ElLoading } from "element-plus"
import { defineComponent, ref, h } from "vue"
import { renderOptionItem, tooltip } from "../common"
import { UploadFilled } from "@element-plus/icons-vue"

const ALL_TYPES: timer.backup.Type[] = [
    'none',
    'gist',
]

const typeOptions = () => ALL_TYPES.map(type => h(ElOption, {
    value: type,
    label: t(msg => msg.option.backup.meta[type].label)
}))

const typeSelect = (type: Ref<timer.backup.Type>, handleChange?: Function) => h(ElSelect,
    {
        modelValue: type.value,
        size: 'small',
        style: { width: '120px' },
        async onChange(newType: timer.backup.Type) {
            type.value = newType
            handleChange?.()
        }
    },
    () => typeOptions()
)

const clientNameInput = (clientName: Ref<string>, handleInput?: Function) => h(ElInput, {
    modelValue: clientName.value,
    size: 'small',
    style: { width: '120px' },
    placeholder: DEFAULT.clientName,
    onInput: newVal => {
        clientName.value = newVal?.trim?.() || ''
        handleInput?.()
    }
})

const authInput = (auth: Ref<string>, handleInput: Function, handleTest: Function) => h(ElInput, {
    modelValue: auth.value,
    size: 'small',
    type: 'password',
    showPassword: true,
    style: { width: '400px' },
    onInput: newVal => {
        auth.value = newVal?.trim?.() || ''
        handleInput()
    }
}, {
    append: () => h(ElButton, {
        onClick: () => handleTest()
    }, () => t(msg => msg.option.backup.test))
})

const DEFAULT = defaultBackup()

const _default = defineComponent({
    name: "BackupOptionContainer",
    setup(_props, ctx) {
        const type: Ref<timer.backup.Type> = ref(DEFAULT.backupType)
        const auth: Ref<string> = ref('')
        const clientName: Ref<string> = ref(DEFAULT.clientName)

        optionService.getAllOption().then(currentVal => {
            clientName.value = currentVal.clientName
            type.value = currentVal.backupType
            if (type.value) {
                auth.value = currentVal.backupAuths?.[type.value]
            }
        })

        function handleChange() {
            const backupAuths = {}
            backupAuths[type.value] = auth.value
            const newOption: timer.option.BackupOption = {
                backupType: type.value,
                backupAuths,
                clientName: clientName.value || DEFAULT.clientName
            }
            optionService.setBackupOption(newOption)
        }

        async function handleTest() {
            const loading = ElLoading.service({
                text: "Please wait...."
            })
            const errorMsg = await processor.test(type.value, auth.value)
            loading.close()
            if (!errorMsg) {
                ElMessage.success("Valid!")
            } else {
                ElMessage.error(errorMsg)
            }
        }

        async function handleBackup() {
            const loading = ElLoading.service({
                text: "Doing backup...."
            })
            const result = await processor.syncData()
            loading.close()
            if (result.success) {
                ElMessage.success('Successfully!')
            } else {
                ElMessage.error(result.errorMsg || 'Unknown error')
            }
        }

        ctx.expose({
            reset() {
                // Only reset type
                type.value = DEFAULT.backupType
            }
        })

        return () => {
            const nodes = [
                h(ElAlert, {
                    closable: false,
                    type: "warning",
                    description: t(msg => msg.option.backup.alert)
                }),
                h(ElDivider),
                renderOptionItem({
                    input: typeSelect(type, handleChange)
                },
                    msg => msg.backup.type,
                    t(msg => msg.option.backup.meta[DEFAULT.backupType].label)
                )
            ]
            type.value !== 'none' && nodes.push(
                h(ElDivider),
                renderOptionItem({
                    input: authInput(auth, handleChange, handleTest),
                    info: tooltip(msg => msg.option.backup.meta[type.value].authInfo)
                },
                    msg => msg.backup.meta[type.value].auth
                ),
                h(ElDivider),
                renderOptionItem({
                    input: clientNameInput(clientName, handleChange)
                },
                    msg => msg.backup.client
                ),
                h(ElDivider),
                h(ElButton, {
                    type: 'primary',
                    icon: UploadFilled,
                    onClick: handleBackup
                }, () => t(msg => msg.option.backup.operation))
            )
            return h('div', nodes)
        }
    }
})

export default _default