
/**
 * Copyright (c) 2021-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { type I18nKey } from "@app/locale"
import { ANALYSIS_ROUTE, MERGE_ROUTE } from "@app/router/constants"
import { Aim, Connection, HelpFilled, Histogram, Memo, MoreFilled, Rank, SetUp, Stopwatch, Timer, View } from "@element-plus/icons-vue"
import { getGuidePageUrl } from "@util/constant/url"
import { type IconProps } from "element-plus"
import About from "../icons/About"
import Database from "../icons/Database"
import Table from "../icons/Table"
import Trend from "../icons/Trend"
import Website from "../icons/Website"
import Whitelist from "../icons/Whitelist"

export type MenuItem = {
    title: I18nKey
    icon: IconProps | string
    route?: string
    href?: string
    index?: string
    /**
     * Whether to support mobile
     *
     * @since 2.4.2
     */
    mobile?: boolean
}

export type MenuGroup = Omit<MenuItem, 'href' | 'route'> & {
    children: MenuItem[]
}

/**
 * Menu items
 */
export const MENU_GROUPS: MenuGroup[] = [{
    title: msg => msg.menu.data,
    index: 'data',
    icon: Histogram,
    children: [{
        title: msg => msg.menu.dashboard,
        route: '/data/dashboard',
        icon: Stopwatch,
        mobile: true,
    }, {
        title: msg => msg.menu.dataReport,
        route: '/data/report',
        icon: Table,
        mobile: true,
    }, {
        title: msg => msg.menu.siteAnalysis,
        route: ANALYSIS_ROUTE,
        icon: Trend,
        mobile: true,
    }, {
        title: msg => msg.menu.dataClear,
        route: '/data/manage',
        icon: Database,
        mobile: true,
    }]
}, {
    title: msg => msg.menu.behavior,
    index: 'behavior',
    icon: View,
    children: [{
        title: msg => msg.menu.habit,
        route: '/behavior/habit',
        icon: Aim,
        mobile: true,
    }, {
        title: msg => msg.menu.limit,
        route: '/behavior/limit',
        icon: Timer
    }]
}, {
    title: msg => msg.menu.additional,
    index: 'additional',
    icon: Connection,
    children: [{
        title: msg => msg.menu.siteManage,
        route: '/additional/site-manage',
        icon: Website
    }, {
        title: msg => msg.menu.whitelist,
        route: '/additional/whitelist',
        icon: Whitelist
    }, {
        title: msg => msg.menu.mergeRule,
        route: MERGE_ROUTE,
        icon: Rank
    }, {
        title: msg => msg.base.option,
        route: '/additional/option',
        icon: SetUp,
        mobile: true,
    }]
}, {
    title: msg => msg.menu.other,
    index: 'other',
    icon: MoreFilled,
    children: [{
        title: msg => msg.base.guidePage,
        href: getGuidePageUrl(),
        icon: Memo,
        index: '_guide',
    }, {
        title: msg => msg.menu.helpUs,
        route: '/other/help',
        icon: HelpFilled,
    }, {
        title: msg => msg.menu.about,
        route: '/other/about',
        icon: About,
        mobile: true,
    }]
}]

export const NAV_MENUS: MenuItem[] = MENU_GROUPS.flatMap(g => g.children || []).filter(m => m.mobile)