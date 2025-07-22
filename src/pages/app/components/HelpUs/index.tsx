import { createTabAfterCurrent } from "@api/chrome/tab"
import { t } from "@app/locale"
import { Pointer } from "@element-plus/icons-vue"
import Box from "@pages/components/Box"
import { CROWDIN_HOMEPAGE } from "@util/constant/url"
import { ElAlert, ElButton, ElCard } from "element-plus"
import { type FunctionalComponent } from "vue"
import ContentContainer from "../common/ContentContainer"
import MemberList from "./MemberList"
import ProgressList from "./ProgressList"

const handleJump = () => createTabAfterCurrent(CROWDIN_HOMEPAGE)

const HelpUs: FunctionalComponent = () => (
    <ContentContainer>
        <ElCard>
            <ElAlert type="info" title={t(msg => msg.helpUs.title)}>
                <li>{t(msg => msg.helpUs.alert.l1)}</li>
                <li>{t(msg => msg.helpUs.alert.l2)}</li>
                <li>{t(msg => msg.helpUs.alert.l3)}</li>
                <li>{t(msg => msg.helpUs.alert.l4)}</li>
            </ElAlert>
            <Box marginBlock={30}>
                <ElButton type="primary" size="large" icon={Pointer} onClick={handleJump}>
                    {t(msg => msg.helpUs.button)}
                </ElButton>
            </Box>
            <ProgressList />
            <MemberList />
        </ElCard>
    </ContentContainer>
)
HelpUs.displayName = 'HelpUs'

export default HelpUs