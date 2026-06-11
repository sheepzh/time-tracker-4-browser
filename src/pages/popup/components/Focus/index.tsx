import { APP_FOCUS_ROUTE } from '@/shared/route'
import Flex from '@pages/components/Flex'
import { useViewSlots } from '@popup/context'
import { getAppPageUrl } from '@util/constant/url'
import { defineComponent, FunctionalComponent } from 'vue'
import Option from '../Option'
import { useFocusContext, useFocusSetup } from './context'
import SessionToolbar from './session/SessionToolbar'
import SessionView from './session/SessionView'
import SetupForm from './setup/SetupForm'
import SetupToolbar from './setup/SetupToolbar'
import TemplateSelect from './setup/TemplateSelect'
import TemplateToolbar from './setup/TemplateToolbar'

const FOCUS_URL = getAppPageUrl(APP_FOCUS_ROUTE)

const Toolbar: FunctionalComponent<{}> = () => (
    <Flex gap={2}>
        <SessionToolbar />
        <TemplateToolbar />
        <SetupToolbar />
    </Flex>
)

const FocusMode = defineComponent(() => {
    const { session, refresh } = useFocusContext()
    const { template } = useFocusSetup()

    const { setViewSlots } = useViewSlots()
    setViewSlots({ toolbar: <Toolbar />, headerOption: <Option.Link href={FOCUS_URL} /> })

    return () => {
        if (session.value) return <SessionView session={session.value} onComplete={refresh} />
        if (!template.value) return <TemplateSelect />
        return <SetupForm />
    }
})

export default FocusMode