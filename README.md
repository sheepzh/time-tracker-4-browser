# Time Tracker for Browser

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

Time Tracker is a browser extension to track the time you spent on all websites. It's built by rspack, TypeScript and Element-plus. And you can install it for Firefox, Chrome and Edge.

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
    <img src="./doc/screenshot/popup.png" width="100%">
    <p>Daily percentage</p>
</div>

<div align="center">
    <img src="./doc/screenshot/app.png" width="100%">
    <p>Dashboard</p>
</div>

<div align="center">
    <img src="./doc/screenshot/analyze.png" width="100%">
    <p>Analytical Report</p>
</div>

<div align="center">
    <img src="./doc/screenshot/habit.png" width="100%">
    <p>Habit Report</p>
</div>

<div align="center">
    <img src="./doc/screenshot/block.png" width="100%">
    <p>Page Blocking</p>
</div>

## Feedback

If you encounter any issues or have suggestions during use, feel free to reach out through the following channels:

#### 1. Submit an Issue

Describe your problem or feature request in [GitHub Issues](https://github.com/sheepzh/time-tracker-4-browser/issues), and we'll get back to you as soon as possible.

#### 2. Join Discord

Join our [Discord community](https://discord.gg/yXCngD8pKS) to chat directly with the developer and other users.

#### 3. Create a Discussion

Start a topic in [GitHub Discussions](https://github.com/sheepzh/time-tracker-4-browser/discussions) — great for sharing experiences or open-ended conversations.

## Contribution

There are some things you can do to contribute to this software.

#### 1. Participate in development

If you know how to develop browser extensions and are familiar with the project's technology stack (TypeScript + Vue3 + Element Plus + Echarts), you can also contribute code

See the [Development Guide](./CONTRIBUTING.md)

#### 3. Perfect translation

Most of the software's localization relies on machine translation. You can also submit translation suggestions on [Crowdin](https://crowdin.com/project/timer-chrome-edge-firefox).

#### 4. Rate 5 stars

[Firefox](https://addons.mozilla.org/firefox/addon/besttimetracker) / [Chrome](https://chrome.google.com/webstore/detail/%E7%BD%91%E8%B4%B9%E5%BE%88%E8%B4%B5-%E4%B8%8A%E7%BD%91%E6%97%B6%E9%97%B4%E7%BB%9F%E8%AE%A1/dkdhhcbjijekmneelocdllcldcpmekmm) / [Edge](https://microsoftedge.microsoft.com/addons/detail/timer-the-web-time-is-e/fepjgblalcnepokjblgbgmapmlkgfahc)

It's simple and much helpful!

## ❤️ Thanks To

![Thanks To](https://gist.githubusercontent.com/sheepzh/cb33b8b1a1e21b533bf650483b125af5/raw/contributors.svg)