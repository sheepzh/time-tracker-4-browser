# 网费很贵

[![codecov](https://codecov.io/gh/sheepzh/time-tracker-4-browser/branch/main/graph/badge.svg?token=S98QSBSKCR&style=flat-square)](https://codecov.io/gh/sheepzh/time-tracker-4-browser)
[![](https://img.shields.io/badge/license-Anti%20996-blue)](https://github.com/996icu/996.ICU)
[![](https://img.shields.io/github/v/release/sheepzh/time-tracker-4-browser)](https://github.com/sheepzh/time-tracker-4-browser/releases)

\[ 简体中文 | [English](./README.md) \]

网费很贵是一款用于上网时间统计的浏览器插件，使用 rspack，TypeScript 和 Element-plus 进行开发。你可以在 Firefox，Chrome 和 Edge 中安装并使用它。

-   统计用户在不同网站上的浏览时间，和访问次数
-   统计用户阅读本地文件的时间
-   网站白名单，过滤不需要统计的网站
-   支持多个域名合并统计，用户可以自定义合并规则
-   统计用户在不同时段的上网习惯
-   限制每天浏览指定网站的时间
-   支持数据导出导入
-   支持将数据备份到 Gist，以及远程查询已备份的多端数据
-   支持夜间模式

## 下载地址

[![Chrome](https://img.shields.io/chrome-web-store/v/dkdhhcbjijekmneelocdllcldcpmekmm?color=orange&label=Google%20Chrome)](https://chrome.google.com/webstore/detail/%E7%BD%91%E8%B4%B9%E5%BE%88%E8%B4%B5-%E4%B8%8A%E7%BD%91%E6%97%B6%E9%97%B4%E7%BB%9F%E8%AE%A1/dkdhhcbjijekmneelocdllcldcpmekmm?hl=zh-CN)
[![](https://img.shields.io/chrome-web-store/rating/dkdhhcbjijekmneelocdllcldcpmekmm?color=orange&label=rating)](https://chrome.google.com/webstore/detail/%E7%BD%91%E8%B4%B9%E5%BE%88%E8%B4%B5-%E4%B8%8A%E7%BD%91%E6%97%B6%E9%97%B4%E7%BB%9F%E8%AE%A1/dkdhhcbjijekmneelocdllcldcpmekmm?hl=zh-CN)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/users/dkdhhcbjijekmneelocdllcldcpmekmm?color=orange)](https://chrome.google.com/webstore/detail/%E7%BD%91%E8%B4%B9%E5%BE%88%E8%B4%B5-%E4%B8%8A%E7%BD%91%E6%97%B6%E9%97%B4%E7%BB%9F%E8%AE%A1/dkdhhcbjijekmneelocdllcldcpmekmm?hl=zh-CN)

[![Edge](https://img.shields.io/badge/dynamic/json?label=Microsoft%20Edge&prefix=v&query=%24.version&url=https%3A%2F%2Fmicrosoftedge.microsoft.com%2Faddons%2Fgetproductdetailsbycrxid%2Ffepjgblalcnepokjblgbgmapmlkgfahc)](https://microsoftedge.microsoft.com/addons/detail/timer-running-browsin/fepjgblalcnepokjblgbgmapmlkgfahc)
[![](https://img.shields.io/badge/dynamic/json?label=rating&suffix=/5&query=%24.averageRating&url=https%3A%2F%2Fmicrosoftedge.microsoft.com%2Faddons%2Fgetproductdetailsbycrxid%2Ffepjgblalcnepokjblgbgmapmlkgfahc)](https://microsoftedge.microsoft.com/addons/detail/timer-running-browsin/fepjgblalcnepokjblgbgmapmlkgfahc)
[![](https://img.shields.io/badge/dynamic/json?label=users&query=%24.activeInstallCount&url=https%3A%2F%2Fmicrosoftedge.microsoft.com%2Faddons%2Fgetproductdetailsbycrxid%2Ffepjgblalcnepokjblgbgmapmlkgfahc)](https://microsoftedge.microsoft.com/addons/detail/timer-running-browsin/fepjgblalcnepokjblgbgmapmlkgfahc)

[![Firefox](https://img.shields.io/amo/v/2690100?color=green&label=Mozilla%20Firefox)](https://addons.mozilla.org/zh-CN/firefox/addon/web%E6%99%82%E9%96%93%E7%B5%B1%E8%A8%88/)
[![](https://img.shields.io/amo/rating/2690100?color=green)](https://addons.mozilla.org/en-US/firefox/addon/2690100)
[![Mozilla Add-on](https://img.shields.io/amo/users/2690100?color=green)](https://addons.mozilla.org/en-US/firefox/addon/2690100)

![User Count](./script/output/user_count.svg)

## 截图

> 弹窗页展示今日数据

<div align="center">
	<img src="./doc/screenshot/popup.png" width="100%">
</div>

> 所有功能

<div align="center">
	<img src="./doc/screenshot/app.png" width="100%">
</div>

## 贡献指南

如果你想参与到该项目的开源建设，可以考虑以下几种方式

#### 提交 Issue

如果您有一些好的想法，或者 bug 反馈，可以新建一条 [issue](https://github.com/sheepzh/time-tracker-4-browser/issues) 。作者会在第一时间进行回复。

#### 参与开发

如果你知道如何开发浏览器扩展，并且熟悉该项目的技术栈 ( TypeScript + vue3 + ElementPlus )，也可以贡献代码

参见[开发指南](./CONTRIBUTING.md)。

> 当然也欢迎新手同学使用该项目作为学习项目自己练手

#### 完善翻译

除了简体中文外，该扩展另外的本地化语言都依赖机翻。所以也非常欢迎您在 [Crowdin](https://crowdin.com/project/timer-chrome-edge-firefox) 里提交翻译建议。

#### 好评鼓励

至于最简单粗暴的贡献方式，当然是在 [Firefox](https://addons.mozilla.org/zh-CN/firefox/addon/web%E6%99%82%E9%96%93%E7%B5%B1%E8%A8%88/) / [Chrome](https://chrome.google.com/webstore/detail/%E7%BD%91%E8%B4%B9%E5%BE%88%E8%B4%B5-%E4%B8%8A%E7%BD%91%E6%97%B6%E9%97%B4%E7%BB%9F%E8%AE%A1/dkdhhcbjijekmneelocdllcldcpmekmm) / [Edge](https://microsoftedge.microsoft.com/addons/detail/timer-the-web-time-is-e/fepjgblalcnepokjblgbgmapmlkgfahc) 好评三连啦 XXD

## 致谢

<a href="https://www.producthunt.com/posts/timer?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-timer" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=303723&theme=light" alt="Timer - Count your browsing time and visits on every sites | Product Hunt" style="width: 250px; height: 54px;" width="250" height="54" /></a>
