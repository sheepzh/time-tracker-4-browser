# Time Tracker - Web Habit Builder

[![codecov](https://codecov.io/gh/sheepzh/time-tracker-4-browser/branch/main/graph/badge.svg?token=S98QSBSKCR&style=flat-square)](https://codecov.io/gh/sheepzh/time-tracker-4-browser)
[![](https://img.shields.io/badge/license-Anti%20996-blue)](https://github.com/996icu/996.ICU)
[![Crowdin](https://badges.crowdin.net/timer-chrome-edge-firefox/localized.svg)](https://crowdin.com/project/timer-chrome-edge-firefox)
[![Discord](https://img.shields.io/badge/discord-join-5865F2?logo=discord&logoColor=white)](https://discord.gg/yXCngD8pKS)

<p>
  <a href="https://chromewebstore.google.com/detail/dkdhhcbjijekmneelocdllcldcpmekmm/reviews"><img src="https://developer.chrome.com/static/docs/webstore/branding/image/206x58-chrome-web-bcb82d15b2486.png" alt="Available in the Chrome Web Store" height="48"></a>
  <a href="https://microsoftedge.microsoft.com/addons/detail/time-tracker-web-habit-/fepjgblalcnepokjblgbgmapmlkgfahc"><img src="https://developer.microsoft.com/store/badges/images/English_get-it-from-MS.png" alt="Get it from Microsoft" height="48"></a>
  <a href="https://addons.mozilla.org/firefox/addon/besttimetracker/reviews/"><img src="https://blog.mozilla.org/addons/files/2020/04/get-the-addon-fx-apr-2020.svg" alt="Get the add-on" height="48"></a>
</p>

\[ English | [简体中文](./README-zh.md) \]

Time Tracker - Web Habit Builder is a browser extension that tracks the time you spend on websites and helps you understand your browsing habits.

It includes detailed browsing records, dashboards and analytical reports, website management, limits and page blocking, Focus and Pomodoro sessions, and tools for synchronizing, backing up, and migrating data.

It is built with Rspack, TypeScript, Vue 3, Element Plus, and ECharts. You can install it for Firefox, Chrome, and Microsoft Edge.

## Features

-   Track browsing time and visit counts
-   Review detailed records and daily activity
-   View dashboards, website analysis, and habit reports
-   Manage websites and configure whitelist and merge rules
-   Set daily, weekly, and per-visit website limits
-   Block pages when configured limits are reached
-   Create and run Focus and Pomodoro sessions
-   Export and import settings
-   Synchronize data through the supported browser account
-   Back up data with GitHub Gist, WebDAV, or Obsidian Local REST API
-   Use data migration, storage information, and record-clearing tools
-   Customize appearance, tracking, accessibility, limits, backups, and notifications

See the [official guide](https://time-tracker-4-browser.app/en/guide/start) for detailed instructions.

## Download

| Released                                                                                                                            | Version                                                                                                                                                                                                     | Rating                                                                                                                                                                                                             | User Count                                                                                                                                                                                                   |
| ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [Chrome Web Store](https://chromewebstore.google.com/detail/time-tracker-for-browser/dkdhhcbjijekmneelocdllcldcpmekmm?hl=en)        | ![](https://img.shields.io/chrome-web-store/v/dkdhhcbjijekmneelocdllcldcpmekmm?color=orange&label=latest)                                                                                                   | ![](https://img.shields.io/chrome-web-store/rating/dkdhhcbjijekmneelocdllcldcpmekmm?color=orange&label=rating)                                                                                                     | ![](https://img.shields.io/chrome-web-store/users/dkdhhcbjijekmneelocdllcldcpmekmm?color=orange)                                                                                                             |
| [Microsoft Edge Addons](https://microsoftedge.microsoft.com/addons/detail/time-tracker-web-habit-/fepjgblalcnepokjblgbgmapmlkgfahc) | ![](https://img.shields.io/badge/dynamic/json?label=latest&prefix=v&query=%24.version&url=https%3A%2F%2Fmicrosoftedge.microsoft.com%2Faddons%2Fgetproductdetailsbycrxid%2Ffepjgblalcnepokjblgbgmapmlkgfahc) | ![](https://img.shields.io/badge/dynamic/json?label=rating&suffix=/5&query=%24.averageRating&url=https%3A%2F%2Fmicrosoftedge.microsoft.com%2Faddons%2Fgetproductdetailsbycrxid%2Ffepjgblalcnepokjblgbgmapmlkgfahc) | ![](https://img.shields.io/badge/dynamic/json?label=users&query=%24.activeInstallCount&url=https%3A%2F%2Fmicrosoftedge.microsoft.com%2Faddons%2Fgetproductdetailsbycrxid%2Ffepjgblalcnepokjblgbgmapmlkgfahc) |
| [Firefox Browser Addons](https://addons.mozilla.org/en-US/firefox/addon/besttimetracker/)                                           | ![](https://img.shields.io/amo/v/2690100?color=green&label=latest)                                                                                                                                          | ![](https://img.shields.io/amo/rating/2690100?color=green)                                                                                                                                                         | ![Mozilla Add-on](https://img.shields.io/amo/users/2690100?color=green)                                                                                                                                      |

[How to install manually for Safari](./doc/safari-install.md)

![User Count](https://gist.githubusercontent.com/sheepzh/6aaf4c22f909db73b533491167da129b/raw/user_count.svg)

## Screenshots

<div align="center">
    <img src="./doc/screenshot/popup.png" width="100%" alt="Daily browsing percentage">
    <p>Daily percentage</p>
</div>

<div align="center">
    <img src="./doc/screenshot/app.png" width="100%" alt="Time Tracker dashboard">
    <p>Dashboard</p>
</div>

<div align="center">
    <img src="./doc/screenshot/analyze.png" width="100%" alt="Analytical report">
    <p>Analytical Report</p>
</div>

<div align="center">
    <img src="./doc/screenshot/habit.png" width="100%" alt="Browsing habit report">
    <p>Habit Report</p>
</div>

<div align="center">
    <img src="./doc/screenshot/block.png" width="100%" alt="Page blocking">
    <p>Page Blocking</p>
</div>

## Feedback

If you encounter any issues or have suggestions during use, feel free to reach out through the following channels:

#### 1. Submit an Issue

Describe your problem or feature request in [GitHub Issues](https://github.com/sheepzh/time-tracker-4-browser/issues), and we'll get back to you as soon as possible.

#### 2. Join Discord

Join our [Discord community](https://discord.gg/yXCngD8pKS) to chat directly with the developer and other users.

#### 3. Create a Discussion

Start a topic in [GitHub Discussions](https://github.com/sheepzh/time-tracker-4-browser/discussions) to share experiences, ask questions, or discuss open-ended ideas.

## Contribution

There are several ways you can contribute to this software.

#### 1. Participate in development

If you know how to develop browser extensions and are familiar with the project's technology stack—TypeScript, Vue 3, Element Plus, and ECharts—you can contribute code, tests, or documentation.

See the [Development Guide](./CONTRIBUTING.md).

#### 2. Improve translations

Most of the software's localization relies on machine translation. You can submit translation suggestions on [Crowdin](https://crowdin.com/project/timer-chrome-edge-firefox).

#### 3. Rate the extension

You can support the project by leaving a review:

[Firefox](https://addons.mozilla.org/firefox/addon/besttimetracker) /
[Chrome](https://chromewebstore.google.com/detail/time-tracker/dkdhhcbjijekmneelocdllcldcpmekmm/reviews) /
[Edge](https://microsoftedge.microsoft.com/addons/detail/timer-the-web-time-is-e/fepjgblalcnepokjblgbgmapmlkgfahc)

It is simple and helpful. Your feedback supports the project.

For information about data handling, see the [Privacy Policy](https://time-tracker-4-browser.app/en/privacy.html).

## ❤️ Thanks To

![Thanks To](https://gist.githubusercontent.com/sheepzh/cb33b8b1a1e21b533bf650483b125af5/raw/contributors.svg)