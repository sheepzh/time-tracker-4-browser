/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import resource from './site-manage-resource.json'

export type SiteManageMessage = {
    genAliasConfirmMsg: string
    column: {
        type: string
        alias: string
        cate: string
        icon: string
    }
    typeInfo: Record<tt4b.site.Type, string>
    cate: {
        name: string
        relatedMsg: string
        batchChange: string
        batchDisassociate: string
        removeConfirm: string
    }
    form: {
        emptyAlias: string
        emptyHost: string
    }
    msg: {
        hostExistWarn: string
        existedTag: string
        disassociatedMsg: string
        batchDeleteMsg: string
    }
}

const _default: Messages<SiteManageMessage> = resource satisfies Messages<SiteManageMessage>

export default _default
