/**
 * Copyright (c) 2021-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import baseMessages, { type BaseMessage } from "../common/base"
import buttonMessages, { type ButtonMessage } from "../common/button"
import calendarMessages, { type CalendarMessage } from "../common/calendar"
import itemMessages, { type ItemMessage } from "../common/item"
import metaMessages, { type MetaMessage } from "../common/meta"
import operationMessages, { type OperationMessage } from '../common/operation'
import sharedMessages, { type SharedMessage } from '../common/shared'
import limitModalMessages, { type ModalMessage } from "../cs/modal"
import { merge, type MessageRoot } from "../merge"
import aboutMessages, { type AboutMessage } from "./about"
import analysisMessages, { type AnalysisMessage } from "./analysis"
import dashboardMessages, { type DashboardMessage } from "./dashboard"
import dataManageMessages, { type DataManageMessage } from "./data-manage"
import habitMessages, { type HabitMessage } from "./habit"
import helpUsMessages, { type HelpUsMessage } from "./help-us"
import limitMessages, { type LimitMessage } from "./limit"
import menuMessages, { type MenuMessage } from "./menu"
import optionMessages, { type OptionMessage } from "./option"
import recordMessages, { type RecordMessage } from "./record"
import ruleMessages, { type RuleMessage } from "./rule"
import siteManageManages, { type SiteManageMessage } from "./site-manage"
import timeFormatMessages, { type TimeFormatMessage } from "./time-format"

export type AppMessage = {
    about: AboutMessage
    dataManage: DataManageMessage
    item: ItemMessage
    shared: SharedMessage
    record: RecordMessage
    rule: RuleMessage
    option: OptionMessage
    analysis: AnalysisMessage
    menu: MenuMessage
    habit: HabitMessage
    limit: LimitMessage
    siteManage: SiteManageMessage
    operation: OperationMessage
    dashboard: DashboardMessage
    calendar: CalendarMessage
    timeFormat: TimeFormatMessage
    helpUs: HelpUsMessage
    button: ButtonMessage
    meta: MetaMessage
    base: BaseMessage
    limitModal: ModalMessage
}

const MESSAGE_ROOT: MessageRoot<AppMessage> = {
    about: aboutMessages,
    dataManage: dataManageMessages,
    item: itemMessages,
    shared: sharedMessages,
    record: recordMessages,
    rule: ruleMessages,
    option: optionMessages,
    analysis: analysisMessages,
    menu: menuMessages,
    habit: habitMessages,
    limit: limitMessages,
    siteManage: siteManageManages,
    operation: operationMessages,
    dashboard: dashboardMessages,
    calendar: calendarMessages,
    timeFormat: timeFormatMessages,
    helpUs: helpUsMessages,
    button: buttonMessages,
    meta: metaMessages,
    base: baseMessages,
    limitModal: limitModalMessages,
}

const _default = merge<AppMessage>(MESSAGE_ROOT)

export default _default