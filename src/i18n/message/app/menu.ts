/**
 * Copyright (c) 2021-present Hengyang Zhang
 * 
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

export type MenuMessage = {
    dashboard: string
    data: string
    dataReport: string
    siteAnalysis: string
    dataClear: string
    behavior: string
    habit: string
    limit: string
    additional: string
    siteManage: string
    whitelist: string
    mergeRule: string
    option: string
    other: string
    feedback: string
    rate: string
    helpUs: string
    userManual: string
}

const _default: Messages<MenuMessage> = {
    zh_CN: {
        dashboard: '仪表盘',
        data: '我的数据',
        dataReport: '报表明细',
        siteAnalysis: '站点分析',
        dataClear: '内存管理',
        additional: '附加功能',
        siteManage: '网站管理',
        whitelist: '白名单管理',
        mergeRule: '子域名合并',
        option: '扩展选项',
        behavior: '上网行为',
        habit: '上网习惯',
        limit: '每日时限设置',
        other: '其他',
        feedback: '有什么反馈吗？',
        rate: '打个分吧！',
        helpUs: '帮助我们～',
        userManual: '用户手册',
    },
    zh_TW: {
        dashboard: '儀錶盤',
        data: '我的數據',
        dataReport: '報表明細',
        siteAnalysis: '站點分析',
        dataClear: '內存管理',
        additional: '附加功能',
        siteManage: '網站管理',
        whitelist: '白名單管理',
        mergeRule: '子域名合並',
        option: '擴充選項',
        behavior: '上網行爲',
        habit: '上網習慣',
        limit: '每日時限設置',
        other: '其他',
        feedback: '有什麼反饋嗎？',
        rate: '打個分吧！',
        helpUs: '帮助我们～',
        userManual: '使用者手冊',
    },
    en: {
        dashboard: 'Dashboard',
        data: 'My Data',
        dataReport: 'Record',
        siteAnalysis: 'Site Analysis',
        dataClear: 'Memory Situation',
        behavior: 'User Behavior',
        habit: 'Habits',
        limit: 'Daily Limit',
        additional: 'Additional Features',
        siteManage: 'Site Management',
        whitelist: 'Whitelist',
        mergeRule: 'Merge-site Rules',
        other: 'Other Features',
        option: 'Options',
        feedback: 'Feedback Questionnaire',
        rate: 'Rate It',
        helpUs: 'Help Us',
        userManual: 'User Manual',
    },
    ja: {
        dashboard: 'ダッシュボード',
        data: '私のデータ',
        dataReport: '報告する',
        siteAnalysis: 'ウェブサイト分析',
        dataClear: '記憶状況',
        behavior: 'ユーザーの行動',
        habit: '閲覧の習慣',
        limit: '閲覧の制限',
        additional: 'その他の機能',
        siteManage: 'ウェブサイト管理',
        whitelist: 'Webホワイトリスト',
        mergeRule: 'ドメイン合併',
        other: 'その他の機能',
        option: '拡張設定',
        feedback: 'フィードバックアンケート',
        rate: 'それを評価',
        helpUs: '協力する',
        userManual: 'ユーザーマニュアル',
    },
}

export default _default