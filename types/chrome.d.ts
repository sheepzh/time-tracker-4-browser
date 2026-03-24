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