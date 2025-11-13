# How to install for Safari

This is a too poor developer to pay $99 per year for distribution of an open-source and free browser extension in Apple App Store.
So please install it **manually**, GG Safari.

## 0. Download this repository

```shell
git clone https://github.com/sheepzh/time-tracker-4-browser.git
cd time-tracker-4-browser
```

## 1. Install tools

Some tools are required to compile this project to an executable software for Safari.

-   [nodejs & npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
-   [Xcode (compatible for your version of macOS)](https://developer.apple.com/xcode/)

## 2. Compile source code, install & run

There are several steps.

1. Compile the source code programmed with TypeScript to js bundles.

```shell
# Install dependencies
npm install
# Compile
npm run build:safari
```

Then there will be one folder called **dist_prod_safari**.

2. Convert js bundles to Xcode project

```shell
[YOUR_PATH]/Xcode.app/Contents/Developer/usr/bin/safari-web-extension-converter ./dist_prod_safari
```

3. Run Xcode project and one extension app will installed on your macOS
4. Enable this extension
5. Finally, open your Safari
