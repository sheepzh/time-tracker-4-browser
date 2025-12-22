/**
 * Copyright (c) 2021-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import resource from './option-resource.json'

export type OptionMessage = {
    yes: string
    no: string
    followBrowser: string
    appearance: {
        title: string
        // whitelist
        displayWhitelist: string
        whitelistItem: string
        contextMenu: string
        // badge text
        displayBadgeText: string
        badgeBgColor: string
        icon: string
        badgeTextContent: string
        locale: {
            label: string
            changeConfirm: string
            reloadButton: string
        }
        printInConsole: {
            label: string
            console: string
            info: string
        },
        darkMode: {
            label: string
            options: Omit<Record<timer.option.DarkMode, string>, 'default'>
        }
        animationDuration: string
        sidePanel: string
    }
    tracking: {
        title: string
        autoPauseTrack: string
        noActivityInfo: string
        countLocalFiles: string
        localFileTime: string
        localFilesInfo: string
        countTabGroup: string
        tabGroupInfo: string
        tabGroupsPermGrant: string
        fileAccessDisabled: string
        weekStart: string
        weekStartAsNormal: string
    }
    limit: {
        prompt: string
        reminder: string
        level: {
            [level in timer.limit.RestrictionLevel]: string
        } & {
            label: string
            passwordLabel: string
            verificationLabel: string
            verificationDifficulty: {
                [diff in timer.limit.VerificationDifficulty]: string
            }
            strictTitle: string
            strictContent: string
            pswFormLabel: string
            pswFormAgain: string
        }
    }
    backup: {
        title: string
        type: string
        client: string
        meta: {
            [type in timer.backup.Type]: {
                label?: string
                authInfo?: string
            }
        } & {
            [type in Extract<timer.backup.Type, 'obsidian_local_rest_api'>]: {
                endpointInfo: string
            }
        }
        label: {
            endpoint: string
            path: string
            account: string
            password: string
        }
        operation: string
        clientTable: {
            selectTip: string
            dataRange: string
            notSelected: string
            current: string
        }
        download: {
            btn: string
            willDownload: string
            confirmTip: string
        }
        clear: {
            btn: string
            confirmTip: string
        }
        confirmStep: string
        lastTimeTip: string
        auto: {
            label: string
            interval: string
        }
    }
    accessibility: {
        title: string
        chartDecal: string
    }
    resetButton: string
    resetSuccess: string
    exportButton: string
    importButton: string
    exportSuccess: string
    importSuccess: string
    importError: string
    importConfirm: string
    reloadButton: string
    defaultValue: string
}

const _default: Messages<OptionMessage> = resource

export default _default