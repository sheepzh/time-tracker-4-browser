
/**
 * Copyright (c) 2021-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { type I18nKey } from '@app/locale'
import { ANALYSIS_ROUTE, DASHBOARD_ROUTE, MERGE_ROUTE, OPTION_ROUTE, RECORD_ROUTE } from '@app/router/constants'
import { Aim, HelpFilled, Memo, Rank, SetUp, Stopwatch, Timer } from "@element-plus/icons-vue"
import { Focus, Trend } from '@pages/icons'
import { getGuidePageUrl } from "@util/constant/url"
import { type Component } from 'vue'
import About from "../icons/About"
import Database from '../icons/Database'
import Table from "../icons/Table"
import Website from "../icons/Website"
import Whitelist from "../icons/Whitelist"

export type MenuItem = {
    title: I18nKey
    icon: Component | string
    /**
     * Whether to support mobile
     *
     * @since 2.4.2
     */
    mobile?: boolean
} & (
        | { route: string }
        | { href: string }
    )

type MenuGroup = Pick<MenuItem, 'title'> & {
    children: MenuItem[]
}

export const indexOfItem = (item: MenuItem) => 'route' in item ? item.route : item.href

/**
 * Menu items
 */
export const menuGroups = (): MenuGroup[] => [{
    title: msg => msg.menu.overview,
    children: [{
        title: msg => msg.menu.dashboard,
        route: DASHBOARD_ROUTE,
        icon: Stopwatch,
    }, {
        title: msg => msg.menu.record,
        route: RECORD_ROUTE,
        icon: Table,
    }, {
        title: msg => msg.menu.analysis,
        route: ANALYSIS_ROUTE,
        icon: Trend,
    }]
}, {
    title: msg => msg.menu.productivity,
    children: [{
        title: msg => msg.menu.habit,
        route: '/productivity/habit',
        icon: Aim,
    }, {
        title: msg => msg.base.limit,
        route: '/productivity/limit',
        icon: Timer,
    }, {
        title: msg => msg.menu.focus,
        route: '/productivity/focus',
        icon: Focus,
        mobile: false,
    }]
}, {
    title: msg => msg.menu.siteRule,
    children: [{
        title: msg => msg.menu.sites,
        route: '/site-rule/sites',
        icon: Website,
        mobile: false,
    }, {
        title: msg => msg.menu.whitelist,
        route: '/site-rule/whitelist',
        icon: Whitelist,
        mobile: false,
    }, {
        title: msg => msg.menu.mergeRule,
        route: MERGE_ROUTE,
        icon: Rank,
        mobile: false,
    }]
}, {
    title: msg => msg.menu.other,
    children: [{
        title: msg => msg.base.option,
        route: OPTION_ROUTE,
        icon: SetUp,
    }, {
        title: msg => msg.menu.migration,
        route: '/other/migration',
        icon: Database,
    }, {
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