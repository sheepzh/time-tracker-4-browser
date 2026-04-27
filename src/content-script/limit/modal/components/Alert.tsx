import { getIconUrl } from "@api/chrome/runtime"
import { getOption } from "@api/sw/option"
import { t } from "@cs/locale"
import { useRequest, useXsState } from "@hooks"
import Box from '@pages/components/Box'
import Flex from '@pages/components/Flex'
import Img from '@pages/components/Img'
import { defineComponent } from "vue"

const _default = defineComponent(() => {
    const defaultPrompt = t(msg => msg.modal.defaultPrompt)
    const { data: prompt } = useRequest(async () => {
        const option = await getOption()
        return option?.limitPrompt ?? defaultPrompt
    }, { defaultValue: defaultPrompt })

    const isXs = useXsState()

    return () => (
        <Flex marginBottom={80} column align='center'>
            <Flex as='h2' align='center' lineHeight='2em' gap='.4em'>
                <Img src={getIconUrl()} style={{ width: '1.4em', height: '1.4em' }} />
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