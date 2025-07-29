import { createTabAfterCurrent } from "@api/chrome/tab"
import { t } from "@app/locale"
import { Pointer } from "@element-plus/icons-vue"
import Box from "@pages/components/Box"
import { CROWDIN_HOMEPAGE } from "@util/constant/url"
import { ElAlert, ElButton, ElCard, ElScrollbar } from "element-plus"
import { type FunctionalComponent, type StyleValue } from "vue"
import ContentContainer from "../common/ContentContainer"
import MemberList from "./MemberList"
import ProgressList from "./ProgressList"

const handleJump = () => createTabAfterCurrent(CROWDIN_HOMEPAGE)

const HelpUs: FunctionalComponent = () => (
    <ElScrollbar height="100%" style={{ width: '100%' } satisfies StyleValue}>
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
    </ElScrollbar>
)
HelpUs.displayName = 'HelpUs'

export default HelpUs