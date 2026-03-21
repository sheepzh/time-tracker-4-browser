/**
 * Copyright (c) 2021-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import resource from './data-manage-resource.json'

export type DataManageMessage = {
    totalMemoryAlert: string
    totalMemoryAlert1: string
    usedMemoryAlert: string
    idbAlert: string
    operationAlert: string
    filterItems: string
    filterFocus: string
    filterTime: string
    filterDate: string
    paramError: string
    deleteConfirm: string
    migrationAlert: string
    importError: string
    importOther: {
        step1: string
        step2: string
        dataSource: string
        file: string
        conflictType: string
        conflictTip: string
        selectFileBtn: string
        imported: string
        local: string
        fileNotSelected: string
        conflictNotSelected: string
    } & {
        [resolution in timer.imported.ConflictResolution]: string
    }
}

const _default: Messages<DataManageMessage> = resource

export default _default