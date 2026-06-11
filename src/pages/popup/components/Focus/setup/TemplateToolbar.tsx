import { APP_FOCUS_ROUTE, type AppFocusQuery } from '@/shared/route'
import { Plus } from '@element-plus/icons-vue'
import Flex from '@pages/components/Flex'
import { t } from '@popup/locale'
import { getAppPageUrl } from '@util/constant/url'
import { ElButton, ElDropdown, ElDropdownItem, ElDropdownMenu } from 'element-plus'
import { defineComponent, FunctionalComponent } from 'vue'
import { useFocusContext, useFocusSetup } from '../context'
import { TEMPLATE_EMOJIS } from './constants'

type ButtonProps = {
    presets: tt4b.focus.Preset[]
    onSelect: ArgCallback<tt4b.focus.Preset>
}

const ADD_FOCUS_URL = getAppPageUrl(APP_FOCUS_ROUTE, { action: 'create' } satisfies AppFocusQuery)

const PresetButton: FunctionalComponent<ButtonProps> = ({ presets, onSelect }) => {
    const button = (
        <ElButton onClick={() => window.open(ADD_FOCUS_URL)} icon={Plus}>
            {t(msg => msg.focus.button.preset)}
        </ElButton>
    )

    if (!presets.length) return button

    return (
        <ElDropdown
            onCommand={onSelect}
            v-slots={{
                dropdown: () => (
                    <ElDropdownMenu>
                        {presets.map(p => (
                            <ElDropdownItem command={p} key={p.id}>
                                <Flex gap={6} align="center">
                                    <span>{TEMPLATE_EMOJIS[p.template]}</span>
                                    <span>{p.name}</span>
                                </Flex>
                            </ElDropdownItem>
                        ))}
                    </ElDropdownMenu>
                ),
                default: () => button,
            }}
        />
    )
}

const TemplateToolbar = defineComponent<{}>(() => {
    const { session } = useFocusContext()
    const { presets, applyPreset, template } = useFocusSetup()

    return () => !session.value && !template.value && <PresetButton presets={presets.value} onSelect={applyPreset} />
})

export default TemplateToolbar