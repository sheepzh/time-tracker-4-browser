import { APP_FOCUS_ROUTE } from '@/shared/route'
import { Back, Plus, Right, VideoPlay } from '@element-plus/icons-vue'
import { t } from '@popup/locale'
import { getAppPageUrl } from '@util/constant/url'
import { isRtl } from '@util/document'
import { ElButton, ElDropdown, ElDropdownItem, ElDropdownMenu } from 'element-plus'
import { defineComponent, FunctionalComponent } from 'vue'
import { useFocusContext, useFocusSetup } from '../context'

const FOCUS_URL = getAppPageUrl(APP_FOCUS_ROUTE)

type PresetButtonProps = {
    presets: tt4b.focus.Preset[]
    onSelect: ArgCallback<number>
}

const PresetButton: FunctionalComponent<PresetButtonProps> = props => {
    const { presets, onSelect } = props
    if (!presets.length) return (
        <ElButton onClick={() => window.open(FOCUS_URL)} icon={Plus}>
            {t(msg => msg.focus.button.createPreset)}
        </ElButton>
    )

    return (
        <ElDropdown
            onCommand={onSelect}
            v-slots={{
                dropdown: () => (
                    <ElDropdownMenu>
                        {presets.map(p => (
                            <ElDropdownItem command={p.id} key={p.id}>
                                {p.name}
                            </ElDropdownItem>
                        ))}
                    </ElDropdownMenu>
                )
            }}
        >
            <ElButton>{t(msg => msg.focus.button.createPreset)}</ElButton>
        </ElDropdown>
    )
}

const SetupToolbar = defineComponent<{}>(() => {
    const { session } = useFocusContext()
    const { presets, applyPreset, template, resetTemplate, handleStart } = useFocusSetup()

    const onSelect = (id: number) => {
        const preset = presets.value.find(p => p.id === id)
        preset && applyPreset(preset)
    }

    return () => {
        if (session.value) return null

        const tpl = template.value

        // Not show anything if no template selected
        if (!tpl) return null

        const filtered = presets.value.filter(p => p.template === tpl)
        return <>
            <ElButton onClick={resetTemplate} icon={isRtl() ? Right : Back} />
            <PresetButton presets={filtered} onSelect={onSelect} />
            <ElButton nativeType="submit" type='primary' onClick={handleStart} icon={VideoPlay} />
        </>
    }
})

export default SetupToolbar