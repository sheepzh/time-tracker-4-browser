import { APP_FOCUS_ROUTE, type AppFocusQuery } from '@/shared/route'
import { Back, Plus, Right, VideoPlay } from '@element-plus/icons-vue'
import Flex from '@pages/components/Flex'
import { t } from '@popup/locale'
import { getAppPageUrl } from '@util/constant/url'
import { isRtl } from '@util/document'
import { ElButton, ElDropdown, ElDropdownItem, ElDropdownMenu, ElText } from 'element-plus'
import { defineComponent, type FunctionalComponent } from 'vue'
import { useFocusSession, useFocusSetup } from '../context'
import { METHOD_EMOJIS } from './constants'

type ButtonProps = {
    presets: tt4b.focus.Preset[]
    onSelect: ArgCallback<tt4b.focus.Preset>
}

const ADD_FOCUS_URL = getAppPageUrl(APP_FOCUS_ROUTE, { action: 'create' } satisfies AppFocusQuery)

const PresetButton: FunctionalComponent<ButtonProps> = ({ presets, onSelect }) => {
    const button = (
        <ElButton onClick={() => window.open(ADD_FOCUS_URL)} icon={Plus}>
            {t(msg => msg.focus.preset)}
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
                                    <span>{METHOD_EMOJIS[p.method]}</span>
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

const SetupToolbar = defineComponent<{}>(() => {
    const { session } = useFocusSession()
    const { presets, apply, method, handleStart } = useFocusSetup()
    const handleBack = () => method.value = undefined

    return () => {
        if (session.value) return null
        const m = method.value
        if (!m) return <PresetButton presets={presets.value} onSelect={apply} />
        return <>
            <ElText>{METHOD_EMOJIS[m]} {t(msg => msg.focus.method[m].label)}</ElText>
            <ElButton icon={isRtl() ? Right : Back} onClick={handleBack} />
            <ElButton
                data-testid='start-btn' nativeType='submit'
                type='primary' icon={VideoPlay}
                onClick={handleStart}
            />
        </>
    }
})

export default SetupToolbar