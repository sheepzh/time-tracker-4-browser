/**
 * Copyright (c) 2023-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { getMembers } from "@api/crowdin"
import { t } from "@app/locale"
import { useRequest } from "@hooks"
import { ElDivider } from "element-plus"
import { defineComponent } from "vue"

const _default = defineComponent(() => {
    const { data: list } = useRequest(async () => {
        const members = await getMembers() || []
        return members.sort((a, b) => (a.joinedAt || "").localeCompare(b.joinedAt || ""))
    })
    return () => (
        <div class="member-container">
            <ElDivider>{t(msg => msg.helpUs.contributors)}</ElDivider>
            <div class="list">
                {list.value?.map(({ avatarUrl, username }) => (
                    <a href={`https://crowdin.com/profile/${username}`} target="_blank">
                        <img src={avatarUrl} alt={username} title={username} />
                    </a>
                ))}
            </div>
        </div>
    )
})

export default _default
