/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { useCategory } from "@app/context"
import { Download } from "@element-plus/icons-vue"
import { useTabGroups } from "@hooks/useTabGroups"
import { ElButton, ElDropdown, ElDropdownItem, ElDropdownMenu, ElIcon } from "element-plus"
import { defineComponent } from "vue"
import { queryAll } from "../common"
import { useReportFilter, useReportSort } from "../context"
import { exportCsv, exportJson, ExportParam } from "../file-export"
import { ICON_BTN_STYLE } from "./common"

const ALL_FILE_FORMATS = ["json", "csv"] as const
type FileFormat = typeof ALL_FILE_FORMATS[number]

const DownloadFile = defineComponent(() => {
    const filter = useReportFilter()
    const sort = useReportSort()
    const cate = useCategory()
    const { groupMap } = useTabGroups()

    const handleDownload = async (format: FileFormat) => {
        const rows = await queryAll(filter, sort.value)
        const param: ExportParam = {
            rows, filter,
            categories: cate.all,
            groupMap: groupMap.value,
        }
        format === 'json' && exportJson(param)
        format === 'csv' && exportCsv(param)
    }

    return () => (
        <ElDropdown
            showTimeout={100}
            v-slots={{
                dropdown: () => <ElDropdownMenu>
                    {ALL_FILE_FORMATS.map(f =>
                        <ElDropdownItem onClick={() => handleDownload(f)}>
                            {f}
                        </ElDropdownItem>
                    )}
                </ElDropdownMenu>
            }}
        >
            <ElButton size="small" style={ICON_BTN_STYLE}>
                <ElIcon size={17} style={{ padding: "0 1px" }}>
                    <Download />
                </ElIcon>
            </ElButton>
        </ElDropdown>
    )
})

export default DownloadFile