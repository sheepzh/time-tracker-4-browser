import { Asterisk, Merge, Website } from '@pages/icons'
import type { Component } from 'vue'

export const SITE_TOOLBAR_SLOT = 'popup-site-toolbar'
export const SITE_SUMMARY_DROPDOWN_SLOT = 'popup-site-summary-dropdown'

export const SITE_TYPE_ICON: Record<tt4b.site.Type, Component> = {
    normal: Website,
    merged: Merge,
    virtual: Asterisk,
}