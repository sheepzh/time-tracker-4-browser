/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { useXsState } from "@hooks"
import { defineComponent } from "vue"
import ContentContainer from "../common/ContentContainer"
import { initReportContext } from "./context"
import ReportFilter from "./ReportFilter"
import ReportList from "./ReportList"
import ReportTable from "./ReportTable"

const _default = defineComponent(() => {
    const { comp } = initReportContext()
    const isXs = useXsState()

    return () => <ContentContainer v-slots={{
        filter: () => <ReportFilter hideCateFilter={isXs.value} />,
        default: () => isXs.value ? <ReportList ref={comp} /> : <ReportTable ref={comp} />
    }} />
})

export default _default
