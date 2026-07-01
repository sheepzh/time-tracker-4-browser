import type { I18nKey } from '@app/locale'
import type { Component } from 'vue'
import type { OptionCategory } from '../types'
import Accessibility from './Accessibility'
import Appearance from './Appearance'
import Backup from './Backup'
import Limit from './Limit'
import Notification from './Notification'
import Tracking from './Tracking'

export const CATE_CONFIG: Record<OptionCategory, [label: I18nKey, Component]> = {
    appearance: [msg => msg.option.appearance.title, Appearance],
    tracking: [msg => msg.option.tracking.title, Tracking],
    limit: [msg => msg.base.limit, Limit],
    accessibility: [msg => msg.option.accessibility.title, Accessibility],
    backup: [msg => msg.option.backup.title, Backup],
    notification: [msg => msg.option.notification.title, Notification],
}