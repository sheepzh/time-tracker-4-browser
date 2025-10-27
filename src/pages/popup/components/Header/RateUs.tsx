import { createTab } from "@api/chrome/tab"
import { useRequest } from "@hooks/useRequest"
import { t } from "@popup/locale"
import { recommendRate, saveFlag } from "@service/meta-service"
import { REVIEW_PAGE } from "@util/constant/url"
import { ElLink } from "element-plus"
import { defineComponent } from "vue"

const HeartIcon = (
    <svg viewBox="0 0 1024 1024">
        <path d="M1000 248Q976.992 192 933.984 148.992 849.984 64 732.992 64q-64 0-121.504 28T512 171.008q-42.016-51.008-99.488-79.008T291.008 64Q174.016 64 90.016 150.016 47.008 193.024 24 249.024-0.992 308.032 0 371.04q0.992 68.992 28.992 130.496t79.008 104.512q4.992 4 8.992 8 14.016 12 112.992 102.016 208 191.008 256.992 235.008 11.008 8.992 24.992 8.992t24.992-8.992q32.992-30.016 180.992-164.992 158.016-144 196-179.008 52-43.008 80.992-104.992t28.992-132q0-64-24-122.016z" />
    </svg >
)

const RateUs = defineComponent<{}>(() => {
    const { data: rateVisible } = useRequest(recommendRate)

    const handleRateClick = async () => {
        await saveFlag("rateOpen")
        createTab(REVIEW_PAGE)
    }

    return () => (
        <ElLink
            v-show={rateVisible.value}
            type="danger"
            underline="never"
            onClick={handleRateClick}
            style={{ gap: '3px' }}
            icon={HeartIcon}
        >
            {t(msg => msg.header.rate)}
        </ElLink>
    )
})

export default RateUs