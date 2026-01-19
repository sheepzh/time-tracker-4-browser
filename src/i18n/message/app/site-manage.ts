/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import resource from './site-manage-resource.json'

export type SiteManageMessage = {
    deleteConfirmMsg: string
    genAliasConfirmMsg: string
    column: {
        type: string
        alias: string
        cate: string
        icon: string
    }
    type: Record<timer.site.Type, Record<'name' | 'info', string>>
    cate: {
        name: string
        relatedMsg: string
        batchChange: string
        batchDisassociate: string
        removeConfirm: string
        autoRules: string
    }
    form: {
        emptyAlias: string
        emptyHost: string
    }
    msg: {
        hostExistWarn: string
        existedTag: string
        noSelected: string
        noSupported: string
        disassociatedMsg: string
        batchDeleteMsg: string
    }
}

const _default: Messages<SiteManageMessage> = resource satisfies Messages<SiteManageMessage>

export default _default
