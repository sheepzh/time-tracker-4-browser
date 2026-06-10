
/**
 * Copyright (c) 2021-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { type I18nKey } from '@app/locale'
import { ANALYSIS_ROUTE, RECORD_ROUTE, RULE_ROUTE } from '@app/router/constants'
import {
    Aim, Connection, HelpFilled, Histogram, Memo, MoreFilled, SetUp, Stopwatch, Timer, View,
} from "@element-plus/icons-vue"
import { About, Database, Rule, Table, Trend, Website } from '@pages/icons'
import { getGuidePageUrl } from "@util/constant/url"
import { type Component } from 'vue'

type MenuBase = {
    title: I18nKey
    icon: Component | string
    /**
     * Whether to support mobile
     *
     * @since 2.4.2
     */
    mobile?: boolean
}

export type MenuItem = MenuBase & (
    | { route: string }
    | { href: string }
)

type MenuGroup = MenuBase & {
    index: string
    children: MenuItem[]
}

export const indexOfItem = (item: MenuItem) => 'route' in item ? item.route : item.href

/**
 * Menu items
 */
export const menuGroups = (): MenuGroup[] => [{
    title: msg => msg.menu.data,
    index: 'data',
    icon: Histogram,
    children: [{
        title: msg => msg.menu.dashboard,
        route: '/data/dashboard',
        icon: Stopwatch,
    }, {
        title: msg => msg.menu.record,
        route: RECORD_ROUTE,
        icon: Table,
    }, {
        title: msg => msg.menu.siteAnalysis,
        route: ANALYSIS_ROUTE,
        icon: Trend,
    }, {
        title: msg => msg.menu.dataClear,
        route: '/data/manage',
        icon: Database,
    }]
}, {
    title: msg => msg.menu.behavior,
    index: 'behavior',
    icon: View,
    children: [{
        title: msg => msg.menu.habit,
        route: '/behavior/habit',
        icon: Aim,
    }, {
        title: msg => msg.base.limit,
        route: '/behavior/limit',
        icon: Timer,
    }]
}, {
    title: msg => msg.menu.additional,
    index: 'additional',
    icon: Connection,
    children: [{
        title: msg => msg.menu.siteManage,
        route: '/additional/site-manage',
        icon: Website,
        mobile: false,
    }, {
        title: msg => msg.menu.rule,
        route: RULE_ROUTE,
        icon: Rule,
    }, {
        title: msg => msg.base.option,
        route: '/additional/option',
        icon: SetUp,
    }]
}, {
    title: msg => msg.menu.other,
    index: 'other',
    icon: MoreFilled,
    children: [{
        title: msg => msg.base.guidePage,
        href: getGuidePageUrl(),
        icon: Memo,
        mobile: false,
    }, {
        title: msg => msg.base.helpUs,
        route: '/other/help',
        icon: HelpFilled,
        mobile: false,
    }, {
        title: msg => msg.menu.about,
        route: '/other/about',
        icon: About,
    }]
}]

export const navMenus = (): MenuItem[] => menuGroups().flatMap(g => g.children || []).filter(({ mobile = true }) => mobile)