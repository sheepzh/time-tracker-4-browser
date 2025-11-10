/**
 * ABBRs for namespace chrome
 */
// chrome.tabs
declare type ChromeTab = chrome.tabs.Tab
declare type ChromeTabActiveInfo = chrome.tabs.OnActivatedInfo
declare type ChromeTabUpdatedInfo = chrome.tabs.OnUpdatedInfo
// chrome.windows
declare type ChromeWindow = chrome.windows.Window
// chrome.contextMenus
declare type ChromeContextMenuCreateProps = chrome.contextMenus.CreateProperties
declare type ChromeContextMenuUpdateProps = Omit<chrome.contextMenus.CreateProperties, "id">
// chrome.alarms
declare type ChromeAlarm = chrome.alarms.Alarm
// chrome.runtime
declare type ChromeOnInstalledReason = `${chrome.runtime.OnInstalledReason}`
declare type ChromeMessageSender = chrome.runtime.MessageSender
declare type ChromeMessageHandler<T = any, R = any> = (req: timer.mq.Request<T>, sender: ChromeMessageSender) => Promise<timer.mq.Response<R>>

declare namespace chrome {
    namespace runtime {
        type ManifestFirefox = Pick<
            ManifestV2,
            | 'name' | 'description' | 'version' | 'manifest_version'
            | 'icons' | 'background' | 'content_scripts' | 'permissions' | 'optional_permissions' | 'browser_action'
            | 'default_locale' | 'homepage_url' | 'key'
        > & {
            // "author" must be string for Firefox
            author?: string
            browser_specific_settings?: {
                gecko?: {
                    id?: string
                    data_collection_permissions?: {
                        required?: DataCollectionPermission[]
                        optional?: DataCollectionPermission[]
                    }
                }
            }
            // see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/sidebar_action
            sidebar_action?: Pick<ManifestAction, 'default_icon' | 'default_title'> & {
                default_panel?: string
                open_at_install?: boolean
            }
        }
        type DataCollectionPermission = 'none'
    }
}

/**
 * Firefox-specific APIs
 */
declare namespace browser {
    namespace sidebarAction {
        export function open(): Promise<void>
    }
}