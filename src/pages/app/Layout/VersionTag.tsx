/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { css } from '@emotion/css'
import { CLZ_HIDDEN_MD_AND_DOWN } from '@pages/element-ui/style'
import packageInfo from "@src/package"
import type { FunctionalComponent } from "vue"

const CLZ = css`
    position: fixed;
    width: 100px;
    bottom: -10px;
    right: 10px;
    text-align: right;
    color: #888;
    font-size: 8px;
`

const VersionTag: FunctionalComponent = () => (
    <div class={[CLZ_HIDDEN_MD_AND_DOWN, CLZ]}>
        <p style={{ fontSize: "10px" }}>
            {`v${packageInfo.version}`}
        </p>
    </div>
)

export default VersionTag