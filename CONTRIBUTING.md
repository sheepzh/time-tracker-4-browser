# Contributing Guide

## Prerequisites

The technology stack used is:

-   [rspack](https://rspack.dev) + [TypeScript](https://github.com/microsoft/TypeScript)
-   [Vue3 (Composition API + JSX)](<https://vuejs.org/api/#:~:text=defineCustomElement()-,Composition%20API,-setup()>)
-   [sass](https://github.com/sass/sass)
-   [Element Plus](https://element-plus.gitee.io/)
-   [Echarts](https://github.com/apache/echarts)

And [Chrome Extension Development Documentation](https://developer.chrome.com/docs/webstore/). Currently, the manifest version used by Chrome and Edge is v3, and Firefox uses v2. Please pay attention to compatibility.

Some free open source tools are also integrated:

-   Testing tool [jest](https://jestjs.io/docs/getting-started)
-   End-to-end integration testing [puppeteer](https://developer.chrome.com/docs/extensions/how-to/test/puppeteer)
-   I18N tool [Crowdin](https://crowdin.com/project/timer-chrome-edge-firefox)

## Development Setup

### 1. Fork and Setup

1. Fork this repository to your GitHub account
2. Clone your forked repository locally

### 2. Install Dependencies

```shell
npm install
npm run prepare
```

### 3. Create Development Branch

Create a new branch for your changes

### 4. Development Commands

#### Desktop Development

```shell
# Chrome/Edge development
npm run dev

# Firefox development  
npm run dev:firefox

# Safari development
npm run dev:safari
```

This will create output directories:
- `dist_dev` - Chrome/Edge extension
- `dist_dev_firefox` - Firefox extension  
- `dist_dev_safari` - Safari extension

#### Mobile Development (Android)

> See: [Developing extensions for Firefox for Android](https://extensionworkshop.com/documentation/develop/developing-extensions-for-firefox-for-android/)

For Firefox on Android development, use the helper script:

```shell
./script/android-firefox.sh
```

This script will:
- Check prerequisites (web-ext, adb)
- Detect connected Android devices
- Build the extension automatically
- Install and run on Firefox for Android

#### Production Builds

```shell
# Build all platforms
npm run build

# Build specific platform
npm run build:firefox
npm run build:safari
```

### 5. Testing Your Extension

#### Chrome/Edge
1. Open `chrome://extensions/` or `edge://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `dist_dev` folder

#### Firefox
1. Open `about:debugging`
2. Click "This Firefox"
3. Click "Load Temporary Add-on"
4. Select the `manifest.json` file from `dist_dev_firefox` folder

#### Firefox for Android
Use the provided script which handles the entire process automatically.

## Testing

### Unit Tests

```shell
npm run test
```

### Coverage Report

```shell
npm run test-c
```

This will generate coverage reports in the `coverage/` directory.

### End-to-End Tests

> **Note**: This step is optional! All PRs will automatically run this step.

#### Setup E2E Testing

1. Build the test environment:

```shell
npm run dev:e2e
npm run build
```

2. Start test servers:

```shell
npm install -g http-server pm2

pm2 start 'http-server ./test-e2e/example -p 12345'
pm2 start 'http-server ./test-e2e/example -p 12346'
```

3. Run E2E tests:

```shell
npm run test-e2e
```

#### Headless Mode

For headless Puppeteer testing:

```bash
export USE_HEADLESS_PUPPETEER=true
npm run test-e2e
```

## Code Quality

### Code Formatting

- Use single quotes whenever possible
- Keep code concise while being grammatically correct
- No semicolons at the end of lines
- Use LF (`\n`) line endings

For Windows users:

```shell
git config core.autocrlf false
```

### Pre-commit Hooks

The project uses Husky for pre-commit hooks. These will run automatically when you commit:

## Submitting Changes

### 1. Commit Your Changes

```shell
git add .
git commit -m "feat: add new feature description"
# or
git commit -m "fix: fix bug description"
```

Use conventional commit messages:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `style:` for formatting changes
- `refactor:` for code refactoring
- `test:` for adding tests
- `chore:` for maintenance tasks

### 2. Push and Create PR

Create a Pull Request to the `main` branch of this repository.

### 3. PR Requirements

- [ ] All tests pass
- [ ] Documentation updated if needed

## Project Structure

```
time-tracker-4-browser/
├── src/                                   # Source code
│   ├── manifest.ts                        # Chrome/Edge manifest
│   ├── manifest-firefox.ts                # Firefox manifest
│   ├── api/                               # API layer
│   ├── background/                        # Service Worker
│   ├── content-script/                    # Content scripts
│   ├── pages/                             # UI pages
│   │   ├── app/                           # Main app (background page)
│   │   ├── popup/                         # Extension popup
│   │   │   ├── skeleton.ts                # Popup skeleton
│   │   │   └── index.ts                   # Popup entry
│   │   └── side/                          # Side panel
│   ├── service/                           # Business logic
│   ├── database/                          # Data access layer
│   ├── i18n/                              # Internationalization
│   ├── util/                              # Utilities
│   └── common/                            # Shared code
├── test/                                  # Unit tests
│   └── __mock__/                          # Test mocks
├── test-e2e/                              # End-to-end tests
├── types/                                 # TypeScript declarations
├── rspack/                                # Build configuration
├── script/                                # Build and utility scripts
│   └── android-firefox.sh                 # Android development helper
├── public/                                # Static assets
├── doc/                                   # Documentation
├── dist_dev/                              # Chrome/Edge dev build
├── dist_dev_firefox/                      # Firefox dev build
└── dist_dev_safari/                       # Safari dev build
```

### Key Files

- **`src/manifest.ts`** - Chrome/Edge extension manifest (Manifest V3)
- **`src/manifest-firefox.ts`** - Firefox extension manifest (Manifest V2)
- **`src/background/`** - Service Worker and background scripts
- **`src/content-script/`** - Scripts injected into web pages
- **`src/pages/`** - Extension UI (popup, side panel, options)

## Code format

Please use the code formatting tools that come with VSCode. Please <u>**disable Prettier Eslint**</u> and other formatting tools

-   Use single quotes whenever possible
-   Keep the code as concise as possible while being grammatically correct.
-   No semicolon at the end of the line
-   Please use LF (\n). In Windows, you need to execute the following command to turn off the warning:

```
git config core.autocrlf false
```

## How to use i18n

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
