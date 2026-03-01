import { getUrl } from "@api/chrome/runtime"
import { t } from "@cs/locale"
import { useXsState } from '@hooks/useMediaSize'
import { useRequest } from "@hooks/useRequest"
import Box from '@pages/components/Box'
import Flex from '@pages/components/Flex'
import optionHolder from "@service/components/option-holder"
import { defineComponent, type StyleValue } from "vue"

const ICON_URL = getUrl('static/images/icon.png')

const IMG_STYLE: StyleValue = {
    width: '1.4em',
    height: '1.4em',
    marginInlineEnd: '.4em',
}

const _default = defineComponent(() => {
    const defaultPrompt = t(msg => msg.modal.defaultPrompt)
    const { data: prompt } = useRequest(async () => {
        const option = await optionHolder.get()
        return option?.limitPrompt || defaultPrompt
    }, { defaultValue: defaultPrompt })

    const isXs = useXsState()

    return () => (
        <Flex marginBottom={80} column align='center'>
            <Flex as='h2' align='center' lineHeight='2em'>
                <img src={ICON_URL} style={IMG_STYLE} />
                <span>{t(msg => msg.meta.name)?.toUpperCase()}</span>
            </Flex>
            <Box
                fontSize={`${isXs.value ? 1 : 2.7}em`}
                maxWidth={`${isXs.value ? 80 : 50}vw`}
                marginBlock={`${isXs.value ? .3 : .67}em`}
            >
                {prompt.value}
            </Box>
        </Flex>
    )
})

export default _default