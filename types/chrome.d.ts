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
declare type ChromeMessageHandler = (req: timer.mq.Request<timer.mq.ReqCode>, sender: ChromeMessageSender) => Promise<timer.mq.Response<timer.mq.ReqCode>>
declare type ChromeTabMessageHandler = (req: timer.tab.Request<timer.tab.ReqCode>, sender: ChromeMessageSender) => Promise<timer.tab.Response<timer.tab.ReqCode>>