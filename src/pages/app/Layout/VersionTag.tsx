/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { useLayout } from '@app/context'
import packageInfo from "@src/package"
import { defineComponent, type StyleValue } from "vue"

const STYLE: StyleValue = {
    position: 'fixed',
    width: '100px',
    bottom: '-10px',
    right: '10px',
    textAlign: 'right',
    color: '#888',
    fontSize: '8px',
}

const VersionTag = defineComponent<{}>(() => {
    const layout = useLayout()
    return () => (
        <div v-show={layout.value === 'sidebar'} style={STYLE}>
            <p style={{ fontSize: "10px" }}>
                {`v${packageInfo.version}`}
            </p>
        </div>
    )
})

export default VersionTag