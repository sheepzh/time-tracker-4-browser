/**
 * Copyright (c) 2023-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { t } from "@app/locale"
import { InfoFilled } from "@element-plus/icons-vue"
import Flex from "@pages/components/Flex"
import { ElForm, ElFormItem, ElIcon, ElRadio, ElRadioGroup, ElTooltip } from "element-plus"
import { defineComponent } from "vue"

export const ALL_RESOLUTIONS: timer.imported.ConflictResolution[] = ['overwrite', 'accumulate']

type Value = timer.imported.ConflictResolution | undefined

type Props = {
    modelValue: Value
    onChange: ArgCallback<Value>
}

const ResolutionRadio = defineComponent<Props>(props => {
    return () => (
        <ElForm>
            <ElFormItem
                required
                style={{ margin: 0, display: 'flex', gap: '28px' }}
                v-slots={{
                    label: () => (
                        <Flex align="center" gap={2}>
                            {t(msg => msg.dataManage.importOther.conflictType)}
                            <ElTooltip content={t(msg => msg.dataManage.importOther.conflictTip)}>
                                <ElIcon>
                                    <InfoFilled />
                                </ElIcon>
                            </ElTooltip>
                        </Flex>
                    ),
                    default: () => (
                        <ElRadioGroup
                            modelValue={props.modelValue}
                            onChange={val => props.onChange(val as Value)}
                        >
                            {ALL_RESOLUTIONS.map(resolution => (
                                <ElRadio value={resolution}>
                                    {t(msg => msg.dataManage.importOther[resolution])}
                                </ElRadio>
                            ))}
                        </ElRadioGroup>
                    ),
                }}
            />
        </ElForm>
    )
}, { props: ['modelValue', 'onChange'] })

export default ResolutionRadio