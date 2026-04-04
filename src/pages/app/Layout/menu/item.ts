
/**
 * Copyright (c) 2021-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { type I18nKey } from '@app/locale'
import { ANALYSIS_ROUTE, MERGE_ROUTE } from '@app/router/constants'
import { Aim, Connection, HelpFilled, Histogram, Memo, MoreFilled, Rank, SetUp, Stopwatch, Timer, View } from "@element-plus/icons-vue"
import Trend from '@pages/icons/Trend'
import { getGuidePageUrl } from "@util/constant/url"
import { type Component } from 'vue'
import About from "../icons/About"
import Database from "../icons/Database"
import Table from "../icons/Table"
import Website from "../icons/Website"
import Whitelist from "../icons/Whitelist"

export type MenuItem = {
    title: I18nKey
    icon: Component | string
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
export const menuGroups = (): MenuGroup[] => [{
    title: msg => msg.menu.data,
    index: 'data',
    icon: Histogram,
    children: [{
        title: msg => msg.menu.dashboard,
        route: '/data/dashboard',
        icon: Stopwatch,
    }, {
        title: msg => msg.menu.dataReport,
        route: '/data/report',
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
        title: msg => msg.menu.limit,
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
        title: msg => msg.menu.whitelist,
        route: '/additional/whitelist',
        icon: Whitelist,
        mobile: false,
    }, {
        title: msg => msg.menu.mergeRule,
        route: MERGE_ROUTE,
        icon: Rank,
        mobile: false,
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
        index: '_guide',
        mobile: false,
    }, {
        title: msg => msg.menu.helpUs,
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