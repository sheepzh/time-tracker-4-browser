
/**
 * Copyright (c) 2021-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { type I18nKey } from '@app/locale'
import {
    ABOUT_ROUTE, DASHBOARD_ROUTE, FOCUS_ROUTE, HABIT_ANALYSIS_ROUTE, HELP_ROUTE, LIMIT_ROUTE, MIGRATION_ROUTE,
    OPTION_ROUTE, RECORD_ROUTE, RULE_ROUTE, SITE_ANALYSIS_ROUTE, SITE_MANAGE_ROUTE,
} from '@app/router/constants'
import { Aim, HelpFilled, Memo, SetUp, Stopwatch, Timer } from "@element-plus/icons-vue"
import { About, Database, Focus, Rule, Table, Trend, Website } from '@pages/icons'
import { getGuidePageUrl } from "@util/constant/url"
import { type Component } from 'vue'

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
    title: msg => msg.menu.tracking,
    children: [{
        title: msg => msg.menu.dashboard,
        route: DASHBOARD_ROUTE,
        icon: Stopwatch,
    }, {
        title: msg => msg.menu.record,
        route: RECORD_ROUTE,
        icon: Table,
    }, {
        title: msg => msg.menu.sites,
        route: SITE_MANAGE_ROUTE,
        icon: Website,
        mobile: false,
    }, {
        title: msg => msg.menu.rule,
        route: RULE_ROUTE,
        icon: Rule,
    }]
}, {
    title: msg => msg.menu.analysis,
    children: [
        {
            title: msg => msg.menu.analysis,
            route: SITE_ANALYSIS_ROUTE,
            icon: Trend,
        }, {
            title: msg => msg.menu.habit,
            route: HABIT_ANALYSIS_ROUTE,
            icon: Aim,
        },
    ]
}, {
    title: msg => msg.menu.productivity,
    children: [{
        title: msg => msg.base.limit,
        route: LIMIT_ROUTE,
        icon: Timer,
    }, {
        title: msg => msg.focus.menu,
        route: FOCUS_ROUTE,
        icon: Focus,
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
        route: MIGRATION_ROUTE,
        icon: Database,
    }, {
        title: msg => msg.base.guidePage,
        href: getGuidePageUrl(),
        icon: Memo,
        mobile: false,
    }, {
        title: msg => msg.base.helpUs,
        route: HELP_ROUTE,
        icon: HelpFilled,
        mobile: false,
    }, {
        title: msg => msg.menu.about,
        route: ABOUT_ROUTE,
        icon: About,
    }]
}]

export const navMenus = (): MenuItem[] => menuGroups().flatMap(g => g.children || []).filter(({ mobile = true }) => mobile)