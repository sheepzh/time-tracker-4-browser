# Contributing Guide

## 1. Prerequisites

The technology stack used is:

-   [rspack](https://rspack.dev) + [TypeScript](https://github.com/microsoft/TypeScript)
-   [Vue3 (Composition API + JSX)](<https://vuejs.org/api/#:~:text=defineCustomElement()-,Composition%20API,-setup()>)
-   [Emotion](https://emotion.sh/docs/introduction)
-   [Element Plus](https://element-plus.gitee.io/)
-   [Echarts](https://github.com/apache/echarts)

And [Chrome Extension Development Documentation](https://developer.chrome.com/docs/webstore/). Currently, the manifest version used by Chrome and Edge is v3, and Firefox uses v2. Please pay attention to compatibility.

Some free open source tools are also integrated:

-   Testing tool [jest](https://jestjs.io/docs/getting-started)
-   End-to-end integration testing [puppeteer](https://developer.chrome.com/docs/extensions/how-to/test/puppeteer)
-   I18N tool [Crowdin](https://crowdin.com/project/timer-chrome-edge-firefox)

## 2. Steps

1. Fork your repository
2. Install dependencies and initialize

```shell
npm install
npm run prepare
```

3. Create your own branch
4. Code & run

First execute the command

```shell
npm run dev
# or if you want to run in Firefox
npm run dev:firefox
```

Two folders will be output in the project root directory, `dist_dev` and `dist_dev_firefox`

Then import different targets according to the test browser:

-   Import `dist_dev` into Chrome and Edge
-   Import the `manifest.json` file in `dist_dev_firefox` for Firefox

5. Run unit tests

```shell
npm run test
```

6. Run end-to-end tests

First, you need to compile twice: integration compilation and production compilation

```shell
npm run dev:e2e
npm run build
```

Then execute the test

```shell
npm run test-e2e
```

If you need to start puppeteer in headless mode, you can set the following environment variables

```bash
export USE_HEADLESS_PUPPETEER=true
```

7. Submit a PR

Please PR to the main branch of this repository.

## 3. Application architecture design

> todo

## 4. Directory Structure

```plain
project
│
└───doc                                    # Documents
│
└───public                                 # Assets
|
└───src
|   |   manifest.ts                        # manifest.json for Chrome and Edge
|   |   manifest-firefox.ts                # manifest.json for Firefox
|   |
|   └───api                                # API
|   |
|   └───pages                              # UI
|   |   |
|   |   └───app                            # Background page
|   |   |
|   |   └───popup                          # Popup page
|   |   |   |
|   |   |   └───skeleton.ts                # Skeleton of the popup page
|   |   |   |
|   |   |   └───index.ts                   # Popup page entrance
|   |   |
|   |   └───side                           # Side page
|   |   |
|   |   └───[Other dirs]                   # Shared code
|   |
|   └───background                         # Backend service, responsible for coordinating data interaction, Service Worker
|   |
|   └───content-script                     # Script injected into user pages
|   |
|   └───service                            # Service Layer
|   |
|   └───database                           # Data Access Layer
|   |
|   └───i18n                               # Translations
|   |
|   └───util                               # Utils
|   |
|   └───common                             # Shared
|
└───test                                   # Unit tests
|   └───__mock__
|       |
|       └───storage.ts                     # mock chrome.storage
|
└───test-e2e                               # End-to-end tests
|
└───types                                  # Declarations
|
└───rspack                                 # rspack config

```

## 5. Code format

Please use the code formatting tools that come with VSCode. Please <u>**disable Prettier Eslint**</u> and other formatting tools

-   Use single quotes whenever possible
-   Keep the code as concise as possible while being grammatically correct.
-   No semicolon at the end of the line
-   Please use LF (\n). In Windows, you need to execute the following command to turn off the warning:

```
git config core.autocrlf false
```

## 6. How to use i18n

Except for certain professional terms, the text of the user interface can be in English. For the rest, please use i18n to inject text. See the code directory `src/i18n`

### How to add entries

1. Add new fields in the definition file `xxx.ts`
2. Then <u>add the corresponding text of this field in English (en) and Simplified Chinese (zh_CN)</u> in the corresponding resource file `xxx-resource.json`
3. Call `t(msg=>msg...)` in the code to get the text content

### How to integrate with Crowdin

Crowdin is a collaborative translation platform that allows native speakers to help translate multilingual content. The project's integration with Crowdin is divided into two steps

1. Upload English text and other language text in code

```
# Upload original English text
ts-node ./script/crowdin/sync-source.ts
# Upload texts in other languages ​​in local code (excluding Simplified Chinese)
ts-node ./script/crowdin/sync-translation.ts
```

Because the above two scripts rely on the Crowdin access secret in the environment variable, I integrated them into Github's [Action](https://github.com/sheepzh/timer/actions/workflows/crowdin-sync.yml)

2. Export translations from Crowdin

```
ts-node ./script/crowdin/export-translation.ts
```

You can also directly execute [Action](https://github.com/sheepzh/timer/actions/workflows/crowdin-export.yml).
