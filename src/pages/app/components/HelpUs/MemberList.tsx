/**
 * Copyright (c) 2023-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { getMembers } from "@api/crowdin"
import { t } from "@app/locale"
import { useRequest } from "@hooks"
import Box from "@pages/components/Box"
import { ElDivider, ElSpace } from "element-plus"
import { defineComponent } from "vue"

const _default = defineComponent(() => {
    const { data: list } = useRequest(async () => {
        const members = await getMembers() || []
        return members.sort((a, b) => (a.joinedAt || "").localeCompare(b.joinedAt || ""))
    })
    return () => (
        <Box marginTop={10}>
            <ElDivider>{t(msg => msg.helpUs.contributors)}</ElDivider>
            <ElSpace wrap>
                {list.value?.map(({ avatarUrl, username }, idx, arr) => (
                    <a
                        href={`https://crowdin.com/profile/${username}`}
                        target="_blank"
                        style={idx === (arr.length - 1) ? { marginInlineEnd: 'auto' } : undefined}
                    >
                        <img
                            src={avatarUrl}
                            alt={username}
                            title={username}
                            style={{ width: '60px', height: '60px', borderRadius: '30px' }}
                        />
                    </a>
                ))}
            </ElSpace>
        </Box>
    )
})

export default _default
