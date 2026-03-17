# CS 架构拆分指引（可执行文档）

本文档是 [cs-architecture-refactor.md](./cs-architecture-refactor.md) 的**具体执行版**，按「领域拆分」和「单步可验证」的方式给出操作顺序、文件路径、代码模板与校验命令。执行时建议按 **Wave** 推进，每完成一个 Wave 做一次构建与功能抽查。

---

## 使用方式

- **按 Wave 执行**：Wave 1 建骨架 + 一个领域（stat）打通全链路；Wave 2–N 按领域逐个补齐并替换引用。
- **每步打勾**：完成一项在对应 `- [ ]` 改为 `- [x]`。
- **校验命令**：每 Wave 结束运行文档中的「本 Wave 校验」再进入下一 Wave。

---

## 前置条件

- [ ] 已阅读 [cs-architecture-refactor.md](./cs-architecture-refactor.md) 的「一、现状概览」和「二、目标架构」。
- [ ] 当前 `npm run build` 可成功。
- [ ] 已确认项目路径别名：`@api` → `src/api`，`@service` → `src/service`，`@db` → `src/database`（见 `tsconfig.json`）。

---

## Wave 1：骨架 + Stat 领域打通

目标：建立 background services 目录、mq 类型扩展、sw 目录，并以 **stat** 为第一个领域完成「background 注册 → sw 封装 → 页面替换」全链路，保证构建通过且 stat 相关功能正常。

### 1.1 扩展 ReqCode 类型（仅 stat）

- [x] 打开 **`types/timer/mq.d.ts`**，在 `ReqCode` 联合类型中追加（保留原有 code，在末尾追加）：

```ts
// 追加以下行（注意逗号）
        | 'stat.selectSite'
        | 'stat.selectSitePage'
        | 'stat.selectCate'
        | 'stat.selectCatePage'
        | 'stat.selectGroup'
        | 'stat.selectGroupPage'
        | 'stat.listHosts'
        | 'stat.mergeDate'
        | 'stat.batchDelete'
        | 'stat.countGroupByIds'
        | 'stat.countSiteByHosts'
        | 'stat.canReadRemote'
        | 'stat.recommendRate'
```

- [x] 保存后执行 `npm run build`，确认无类型报错（若其他地方尚未使用这些 code，不会报错）。

### 1.2 创建 background 领域模块目录与 stat 实现

- [x] 新建目录：**`src/background/services/`**。
- [x] 新建文件 **`src/background/services/stat.ts`**，内容如下（按实际导出名从 `@service/stat-service` 补齐）：

```ts
/**
 * Stat domain: register stat.* ReqCode handlers, delegate to @service/stat-service
 */
import type MessageDispatcher from "../message-dispatcher"
import {
    selectSite,
    selectSitePage,
    selectCate,
    selectCatePage,
    selectGroup,
    selectGroupPage,
    listHosts,
    batchDelete,
    countGroupByIds,
    countSiteByHosts,
    type SiteQuery,
    type CateQuery,
    type GroupQuery,
} from "@service/stat-service"
import { mergeDate } from "@service/stat-service/merge/date"
import { canReadRemote } from "@service/stat-service/remote"
import { recommendRate } from "@service/meta-service"

export default function initStatService(dispatcher: MessageDispatcher) {
    dispatcher
        .register<SiteQuery | undefined, timer.stat.SiteRow[]>('stat.selectSite', param => selectSite(param))
        .register<{ param?: SiteQuery; page?: timer.common.PageQuery }, timer.common.PageResult<timer.stat.SiteRow>>(
            'stat.selectSitePage',
            ({ param, page }) => selectSitePage(param, page)
        )
        .register<CateQuery | undefined, timer.stat.CateRow[]>('stat.selectCate', param => selectCate(param))
        .register<{ query?: CateQuery; page?: timer.common.PageQuery }, timer.common.PageResult<timer.stat.CateRow>>(
            'stat.selectCatePage',
            ({ query, page }) => selectCatePage(query, page)
        )
        .register<GroupQuery | undefined, timer.stat.GroupRow[]>('stat.selectGroup', param => selectGroup(param))
        .register<{ param?: GroupQuery; page?: timer.common.PageQuery }, timer.common.PageResult<timer.stat.GroupRow>>(
            'stat.selectGroupPage',
            ({ param, page }) => selectGroupPage(param, page)
        )
        .register<string | undefined, Record<timer.site.Type, string[]>>('stat.listHosts', q => listHosts(q))
        .register<timer.stat.SiteRow[], timer.stat.SiteRow[]>('stat.mergeDate', rows => Promise.resolve(mergeDate(rows)))
        .register<timer.stat.Row[], void>('stat.batchDelete', targets => batchDelete(targets))
        .register<{ groupIds: number[]; dateRange: timer.stat.StatCondition["date"] }, number>(
            'stat.countGroupByIds',
            ({ groupIds, dateRange }) => countGroupByIds(groupIds, dateRange)
        )
        .register<{ hosts: string[]; dateRange: timer.stat.StatCondition["date"] }, number>(
            'stat.countSiteByHosts',
            ({ hosts, dateRange }) => countSiteByHosts(hosts, dateRange)
        )
        .register<void, boolean>('stat.canReadRemote', () => canReadRemote())
        .register<void, boolean>('stat.recommendRate', () => recommendRate())
}
```

- [ ] 若 `selectGroupPage` 在 stat-service 中名为 `selectGroupByPage` 或返回类型不同，请按实际 API 调整上面 `register` 的泛型与调用。
- [x] 在 **`src/background/index.ts`** 中，在 `const messageDispatcher = new MessageDispatcher()` 之后、`initLimitProcessor(messageDispatcher)` 之前，增加两行：

```ts
import initStatService from "./services/stat"

// ... 在 initLimitProcessor(messageDispatcher) 之前插入：
initStatService(messageDispatcher)
```

- [x] 保存，运行 `npm run build`，确认 background 编译通过。

### 1.3 创建 SW 目录与 stat 模块

- [x] 新建目录：**`src/api/sw/`**。
- [x] 新建 **`src/api/sw/stat.ts`**（各领域独立文件，无 index 聚合；方法命名动词+名词，内部用 requestStat 等封装 sendMsg2Runtime）（类型若来自 service，使用 `import type` 且仅从 types 或本仓库已有类型位置引用，避免把 service 实现打进 client bundle）：

```ts
/**
 * Stat domain: only uses sendMsg2Runtime (requestStat), no @service/@db
 */
import { sendMsg2Runtime } from "@api/chrome/runtime"
import type { SiteQuery, CateQuery, GroupQuery } from "@service/stat-service"

export function selectSite(param?: SiteQuery) {
    return sendMsg2Runtime<SiteQuery | undefined, timer.stat.SiteRow[]>('stat.selectSite', param)
}

export function selectSitePage(param?: SiteQuery, page?: timer.common.PageQuery) {
    return sendMsg2Runtime('stat.selectSitePage', { param, page })
}

export function selectCate(param?: CateQuery) {
    return sendMsg2Runtime<CateQuery | undefined, timer.stat.CateRow[]>('stat.selectCate', param)
}

export function selectCatePage(query?: CateQuery, page?: timer.common.PageQuery) {
    return sendMsg2Runtime('stat.selectCatePage', { query, page })
}

export function selectGroup(param?: GroupQuery) {
    return sendMsg2Runtime<GroupQuery | undefined, timer.stat.GroupRow[]>('stat.selectGroup', param)
}

export function selectGroupPage(param?: GroupQuery, page?: timer.common.PageQuery) {
    return sendMsg2Runtime('stat.selectGroupPage', { param, page })
}

export function listHosts(fuzzyQuery?: string) {
    return sendMsg2Runtime<string | undefined, Record<timer.site.Type, string[]>>('stat.listHosts', fuzzyQuery)
}

export function mergeDate(rows: timer.stat.SiteRow[]) {
    return sendMsg2Runtime<timer.stat.SiteRow[], timer.stat.SiteRow[]>('stat.mergeDate', rows)
}

export function batchDelete(targets: timer.stat.Row[]) {
    return sendMsg2Runtime<timer.stat.Row[], void>('stat.batchDelete', targets)
}

export function countGroupByIds(groupIds: number[], dateRange: timer.stat.StatCondition["date"]) {
    return sendMsg2Runtime('stat.countGroupByIds', { groupIds, dateRange })
}

export function countSiteByHosts(hosts: string[], dateRange: timer.stat.StatCondition["date"]) {
    return sendMsg2Runtime('stat.countSiteByHosts', { hosts, dateRange })
}

export function canReadRemote() {
    return sendMsg2Runtime<void, boolean>('stat.canReadRemote')
}

export function recommendRate() {
    return sendMsg2Runtime<void, boolean>('stat.recommendRate')
}
```

- [ ] 若项目要求 sw 不能依赖 `@service`，可把 `SiteQuery`/`CateQuery`/`GroupQuery` 移到 `types/timer/` 再从这里 `import type` 引用。
- [x] 无统一 index；页面从 `@api/sw/stat` 按需导入命名函数（如 `import { selectSite } from '@api/sw/stat'`）。
- [x] 保存，运行 `npm run build`，确认无报错。

### 1.4 替换「仅使用 stat」的页面引用（第一批）

先替换**只依赖 stat-service、不混用其他 service** 的文件，保证改动最小、易回滚。

- [ ] **`src/pages/app/components/Dashboard/components/MonthOnMonth/index.tsx`**  
  - 将 `import { selectSite } from "@service/stat-service"` 改为  
    `import { selectSite } from "@api/sw/stat"`  
  - 调用处保持 `selectSite(...)` 不变。

- [ ] **`src/pages/app/components/Dashboard/components/Calendar/index.tsx`**  
  - 将 `import { selectSite } from '@service/stat-service'` 改为  
    `import { selectSite } from '@api/sw/stat'`  
  - 调用处不变。

- [ ] **`src/pages/app/components/Dashboard/components/Indicator.tsx`**  
  - 将 `import { selectSite } from "@service/stat-service"` 改为  
    `import { selectSite } from "@api/sw/stat"`  
  - 调用处不变。（若该文件还用了 `periodDatabase`，本 Wave 暂不删，仅改 stat 部分。）

- [ ] **`src/pages/side/Layout.tsx`**  
  - 将 `import { selectSite } from "@service/stat-service"` 改为  
    `import { selectSite } from "@api/sw/stat"`。

- [ ] **`src/pages/side/components/Search/useDatePicker.ts`**  
  - 将 `import { selectSite } from '@service/stat-service'` 改为  
    `import { selectSite } from '@api/sw/stat'`。

- [ ] **`src/pages/app/components/Analysis/context.ts`**  
  - 将 `import { selectCate, selectSite } from "@service/stat-service"` 改为  
    `import { selectCate, selectSite } from "@api/sw/stat"`。

- [ ] **`src/pages/app/components/Habit/components/Site/context.ts`**  
  - 将 `import { selectSite } from "@service/stat-service"` 与  
    `import { mergeDate } from "@service/stat-service/merge/date"`  
  - 改为  
    `import { selectSite, mergeDate } from "@api/sw/stat"`  
  - 调用处不变。

- [ ] **`src/pages/app/components/Analysis/components/Summary/TargetInfo.tsx`**  
  - 仅用 `getSite`，属于 site 领域，本 Wave 不改；若该文件还用了 stat，只改 stat 的 import。

- [ ] **`src/pages/app/components/Report/ReportFilter/RemoteClient.tsx`**  
  - 将 `import { canReadRemote } from '@service/stat-service/remote'` 改为  
    `import { canReadRemote } from '@api/sw/stat'`。

- [ ] **`src/pages/app/components/Report/ReportFilter/BatchDelete.tsx`**  
  - 将  
    `import { batchDelete, countGroupByIds, countSiteByHosts } from "@service/stat-service"`  
  - 改为  
    `import { batchDelete, countGroupByIds, countSiteByHosts } from "@api/sw/stat"`  
  - 若仍引用 `statDatabase` 仅作类型，可改为从 `types` 或 `@db/stat-database` 仅 `import type`。

- [ ] **`src/pages/app/components/Analysis/components/AnalysisFilter/TargetSelect.tsx`**  
  - 将 `import { listHosts } from "@service/stat-service"` 改为  
    `import { listHosts } from "@api/sw/stat"`  
  - `selectAllSites` 属于 site，本 Wave 不改。

- [ ] **`src/pages/app/components/SiteManage/SiteManageModify/HostSelect.tsx`**  
  - 将 `import { listHosts } from "@service/stat-service"` 改为  
    `import { listHosts } from "@api/sw/stat"`  
  - 若存在 `import siteDatabase from '@db/site-database'`，本 Wave 可暂保留或只删 stat 相关。

- [ ] **`src/pages/popup/common.tsx`**  
  - 将  
    `import { selectCate, selectGroup, selectSite } from '@service/stat-service'`  
  - 改为  
    `import { selectCate, selectGroup, selectSite } from '@api/sw/stat'`  
  - `weekHelper` 本 Wave 不改。

- [ ] **`src/pages/popup/components/Percentage/Cate/Wrapper.ts`**  
  - 将 `import { mergeDate } from "@service/stat-service/merge/date"` 改为  
    `import { mergeDate } from "@api/sw/stat"`  
  - `cateService` 本 Wave 不改。

- [ ] **`src/pages/app/components/Dashboard/index.tsx`**  
  - 将 `import { recommendRate, saveFlag } from "@service/meta-service"` 改为：  
    `import { recommendRate } from "@api/sw/stat"` 与  
    `import { saveFlag } from "@service/meta-service"`（或等 Wave 2 meta 再做 saveFlag）。  
  - 若已为 meta 建好 client，可一并改为从 `@api/sw` 引 `recommendRate` 和 `saveFlag`（见 Wave 2）。

- [ ] **`src/pages/app/components/Dashboard/components/TopKVisit/context.ts`**  
  - 将 `import { selectSitePage, type SiteQuery } from "@service/stat-service"` 改为  
    `import { selectSitePage } from "@api/sw/stat"`，  
  - `SiteQuery` 类型改为 `import type { SiteQuery } from "@service/stat-service"` 或从 `types/timer` 引用（若已抽类型）。

- [ ] **`src/pages/app/components/Report/common.ts`**  
  - 将其中对 `selectCate` / `selectCatePage` / `selectGroup` / `selectGroupPage` / `selectSite` / `selectSitePage` 的 import 从 `@service/stat-service` 改为 `@api/sw`；  
  - 若仍有 `statDatabase` 仅作类型，保留 `import type` 或迁到 types。

- [ ] **`src/pages/app/components/Report/ReportTable/index.tsx`**  
  - 将  
    `import { selectCate, selectGroup, selectSite, type SiteQuery } from "@service/stat-service"`  
  - 改为从 `@api/sw` 引入 `selectCate`、`selectGroup`、`selectSite`；  
  - `SiteQuery` 从 types 或 stat-service 的 `import type` 保留。

### 1.5 Wave 1 校验

- [x] 执行：`npm run build`，应成功。
- [x] 执行：`rg "from ['\"]@service/stat-service|from ['\"]@service/stat-service/" src/pages src/content-script`  
  - 预期：仅剩仍使用 `SiteQuery` 等类型的 `import type`，或 0 处（若类型已迁到 types）。
- [ ] 手动验证：打开 Popup、App 仪表盘/分析/报表、Side 搜索，确认统计与筛选正常。

---

## Wave 2：Option + Cate + Meta

目标：为 option、cate、meta 增加 ReqCode、background 注册、sw 及页面替换。

### 2.1 扩展 ReqCode（option / cate / meta）

- [ ] 在 **`types/timer/mq.d.ts`** 的 `ReqCode` 中追加：

```ts
        | 'option.get'
        | 'option.set'
        | 'option.isDarkMode'
        | 'option.setDarkMode'
        | 'option.setLocale'
        | 'option.setBackupOption'
        | 'cate.listAll'
        | 'cate.add'
        | 'cate.saveName'
        | 'cate.remove'
        | 'meta.saveFlag'
        | 'meta.getCid'
        | 'meta.increaseApp'
        | 'meta.increasePopup'
        | 'meta.recommendRate'
```

### 2.2 Background 领域模块

- [ ] 新建 **`src/background/services/option.ts`**：  
  - `register('option.get', () => optionHolder.get())`  
  - `register('option.set', data => optionHolder.set(data))`  
  - `register('option.isDarkMode', ...)` 调 `optionService.isDarkMode`  
  - `register('option.setDarkMode', ...)` 调 `optionService.setDarkMode`  
  - 同上 setLocale、setBackupOption（参见 option-service 签名）。  
  - 在 **`src/background/index.ts`** 中增加 `import initOptionService from "./services/option"` 与 `initOptionService(messageDispatcher)`。

- [ ] 新建 **`src/background/services/cate.ts`**：  
  - `register('cate.listAll', () => cateService.listAll())`  
  - `register('cate.add', name => cateService.add(name))`  
  - `register('cate.saveName', ({ id, name }) => cateService.saveName(id, name))`  
  - `register('cate.remove', id => cateService.remove(id))`  
  - 在 **`src/background/index.ts`** 中增加 `initCateService(messageDispatcher)`。

- [ ] 新建 **`src/background/services/meta.ts`**：  
  - `register('meta.saveFlag', ...)` 调 `saveFlag`  
  - `register('meta.getCid', () => getCid())`  
  - `register('meta.increaseApp', routePath => increaseApp(routePath))`  
  - `register('meta.increasePopup', () => increasePopup())`  
  - `register('meta.recommendRate', () => recommendRate())`  
  - 在 **`src/background/index.ts`** 中增加 `initMetaService(messageDispatcher)`。

### 2.3 Runtime Client

- [ ] 新建 **`src/api/sw/option.ts`**：封装 `get`、`set`、`isDarkMode`、`setDarkMode`、`setLocale`、`setBackupOption`，内部 `sendMsg2Runtime('option.get')` 等。
- [ ] 新建 **`src/api/sw/cate.ts`**：封装 `listAll`、`add`、`saveName`、`remove`。
- [ ] 新建 **`src/api/sw/meta.ts`**：封装 `saveFlag`、`getCid`、`increaseApp`、`increasePopup`、`recommendRate`。
- [ ] 在 **`src/api/sw/option.ts`**、**cate.ts**、**meta.ts** 中实现并导出命名函数（动词+名词）；页面从 `@api/sw/option` 等子路径导入，无 index 聚合。

### 2.4 替换引用（option / cate / meta）

- [ ] 按 [cs-architecture-refactor.md](./cs-architecture-refactor.md) 中 **Phase 5** 的「5.1 Pages（app）」「5.2 Pages（popup）」「5.4 Hooks」表格，将涉及 **optionHolder / optionService / cateService / meta-service** 的文件改为从 `@api/sw` 引入并调用；涉及 **increaseApp / increasePopup / saveFlag / recommendRate** 的改为从 `@api/sw/meta` 导入。

### 2.5 Wave 2 校验

- [ ] `npm run build` 通过。
- [ ] `rg "from ['\"]@service/components/option-holder|from ['\"]@service/option-service|from ['\"]@service/cate-service|from ['\"]@service/meta-service" src/pages src/content-script` 预期仅剩 `import type` 或 0 处（content-script 中 option/limit 等替换见 Wave 3）。

---

## Wave 3：Site 领域

目标：site 全部 ReqCode、background 注册、sw、页面与 content-script 替换。

### 3.1 ReqCode

- [ ] 在 **`types/timer/mq.d.ts`** 追加：

```ts
        | 'site.getSite'
        | 'site.selectAllSites'
        | 'site.selectSitePage'
        | 'site.addSite'
        | 'site.removeSites'
        | 'site.saveSiteCate'
        | 'site.batchSaveSiteCate'
        | 'site.removeIconUrl'
        | 'site.saveSiteRunState'
        | 'site.batchGetSites'
        | 'site.batchSaveAliasNoRewrite'
        | 'site.removeAlias'
        | 'site.saveAlias'
```

### 3.2 Background + Client + 替换

- [ ] 新建 **`src/background/services/site.ts`**，对上述每个 code 注册 handler，内部调 `@service/site-service` 对应方法。
- [ ] 在 **`src/background/index.ts`** 中 `initSiteService(messageDispatcher)`。
- [ ] 新建 **`src/api/sw/site.ts`**，封装上述方法；在 **index.ts** 中导出。
- [ ] 按 refactor 文档 Phase 5 表格，替换所有 **site-service** 的 import 与调用（SiteManage、Report、Analysis、CategorySelect、WhiteInput 等）。

### 3.3 Wave 3 校验

- [ ] `npm run build` 通过。
- [ ] `rg "from ['\"]@service/site-service" src/pages src/content-script` 预期 0 处（或仅 `import type`）。

---

## Wave 4：Limit / Whitelist / Backup

目标：limit、whitelist、backup 三个领域的 ReqCode、background、client、替换。

### 4.1 ReqCode（limit / whitelist / backup）

- [ ] **mq.d.ts** 追加：  
  `limit.select` / `limit.remove` / `limit.updateEnabled` / `limit.updateDelay` / `limit.updateLocked` / `limit.verify`  
  `whitelist.listAll` / `whitelist.add` / `whitelist.remove`  
  `backup.syncData` / `backup.checkAuth` / `backup.clear` / `backup.query` / `backup.getLastBackUp`

### 4.2 Background 模块

- [ ] **`src/background/services/limit.ts`**：注册 limit.*，调 limit-service 与 verification processor。
- [ ] **`src/background/services/whitelist.ts`**：注册 whitelist.*，调 whitelist/service。
- [ ] **`src/background/services/backup.ts`**：注册 backup.*，调 backup/processor 与 meta-service.getLastBackUp。
- [ ] 在 **index.ts** 中依次 `initLimitService`、`initWhitelistService`、`initBackupService`。

### 4.3 Runtime Client + 替换

- [ ] 新建 **limit.ts** / **whitelist.ts** / **backup.ts** 于 `src/api/sw/`，并在 index 导出。
- [ ] 替换所有 limit-service、whitelist/service、backup/processor、meta.getLastBackUp 的页面与 content-script 引用（Limit 页、Whitelist 面板、Backup 相关组件、content-script limit modal/context/reminder）。

### 4.4 Wave 4 校验

- [ ] 构建通过；限时规则、白名单、备份/恢复/清除流程手动走一遍。

---

## Wave 5：Period / Import / Immigration / Memory 与 DB 收口

目标：period、import-processor、immigration、memory 及仍直接访问 @db 的页面改为通过 ReqCode。

### 5.1 ReqCode

- [ ] 追加：`period.merge`、`import.fillExist`、`import.processImportedData`、`immigration.import`（或 `immigration.importData`）、`memory.getUsedStorage`；若需统一读 option/stat/timeline/merge-rule 等，可增加 `optionDb.getOption`、`timeline.query`、`mergeRule.list` 等（与 refactor 文档 Phase 1 表对齐）。

### 5.2 Background + Client + 替换

- [ ] 新建 **period.ts** / **import.ts** / **immigration.ts** / **memory.ts** 于 `src/background/services/`，注册对应 code，调用 period-calculator、period-service、import-processor、immigration、@db/memory-detector。
- [ ] 新建对应 client 于 `src/api/sw/` 并导出。
- [ ] 替换 Habit/Period、DataManage/Migration、DataManage/context、Option/Backup 等仍用 period/import/immigration/memory 或直接 @db 的引用。

### 5.3 Wave 5 校验

- [ ] 构建通过。
- [ ] `rg "from ['\"]@service/components/period-calculator|from ['\"]@service/period-service|from ['\"]@service/components/import-processor|from ['\"]@service/components/immigration|from ['\"]@db/memory-detector" src/pages src/content-script` 预期 0 处（或仅 type）。

---

## Wave 6：Content-script 与剩余 @service / @db

目标：content-script 中剩余 optionHolder、optionService、limitService 全部改为 sw 或 sendMsg2Runtime；页面中残留的 @db 与 @service（如 week-helper、host-merge-ruler、timeline/mergeRule 等）按决策收口或保留 util。

### 6.1 Content-script 替换

- [ ] **limit/modal/context.ts**：limitService → limitClient 或 `trySendMsg2Runtime('cs.getLimitedRules'/'cs.getRelatedRules')`（若已有 cs.* 可不改逻辑，仅去掉 limitService import）。
- [ ] **limit/modal/index.ts**：optionService → optionClient。
- [ ] **limit/modal/components/Footer.tsx**：optionHolder → optionClient.get。
- [ ] **limit/modal/components/Alert.tsx**：optionHolder → optionClient。
- [ ] **limit/reminder/index.ts**：optionService → optionClient。
- [ ] **tracker/normal/idle-detector.ts**：optionHolder → optionClient；保留 trySendMsg2Runtime 用于 cs.getAudible。

### 6.2 页面剩余项

- [ ] **week-helper**：若决策为纯 util，将 `@service/components/week-helper` 迁到 `src/util/week-helper`，页面改为从 `@util` 引用；否则增加 week.* ReqCode 与 client。
- [ ] **host-merge-ruler / useMerge**：若 listHosts 已满足需求则不改；否则增加 mergeRule/list、site.batchGet 或 hostMerge 相关 code，由 background 封装后 client 调用。
- [ ] **timeline / period / merge-rule db**：为仍直接读 db 的页面增加对应 ReqCode（如 timeline.query、period.aggregate、mergeRule.list），在 background 读 db，client 调用。

### 6.3 最终校验

- [ ] `rg "from ['\"]@service|from ['\"]@db" src/pages src/content-script` 结果为 0（或仅允许的 `import type` 从 types）。
- [ ] `npm run build` 通过。
- [ ] 按 [cs-architecture-refactor.md](./cs-architecture-refactor.md) Phase 6「功能回归清单」做一次完整功能回归。

---

## 附录 A：background/index.ts 中 services 调用顺序建议

在 `messageDispatcher.start()` 之前建议顺序（与现有 initCsHandler、initLimitProcessor、initTrackServer 等并列）：

```ts
import initStatService from "./services/stat"
import initSiteService from "./services/site"
import initOptionService from "./services/option"
import initCateService from "./services/cate"
import initLimitService from "./services/limit"
import initBackupService from "./services/backup"
import initWhitelistService from "./services/whitelist"
import initMetaService from "./services/meta"
import initPeriodService from "./services/period"
import initImportService from "./services/import"
import initImmigrationService from "./services/immigration"
import initMemoryService from "./services/memory"

// 在 initLimitProcessor(messageDispatcher) 等之后、messageDispatcher.start() 之前：
initStatService(messageDispatcher)
initSiteService(messageDispatcher)
initOptionService(messageDispatcher)
initCateService(messageDispatcher)
initLimitService(messageDispatcher)
initBackupService(messageDispatcher)
initWhitelistService(messageDispatcher)
initMetaService(messageDispatcher)
initPeriodService(messageDispatcher)
initImportService(messageDispatcher)
initImmigrationService(messageDispatcher)
initMemoryService(messageDispatcher)
```

---

## 附录 B：单领域检查清单（以 stat 为例）

- [ ] `types/timer/mq.d.ts` 已加入所有 `stat.*` ReqCode。
- [ ] `src/background/services/stat.ts` 存在且每个 code 有 register，且返回类型与 stat-service 一致。
- [ ] `src/background/index.ts` 已调用 `initStatService(messageDispatcher)`。
- [ ] `src/api/sw/stat.ts` 存在，且每个方法仅调用 `sendMsg2Runtime('stat.xxx', ...)`，无 @service/@db。
- [ ] `src/api/sw/stat.ts` 存在，且页面从 `@api/sw/stat` 导入命名函数（无 client 对象）。
- [ ] 所有原 `import { ... } from "@service/stat-service"` 的页面/CS 已改为 `import { ... } from "@api/sw/stat"` 等子路径。
- [ ] `npm run build` 通过；stat 相关功能（分析、报表、仪表盘、侧栏）手动验证通过。

其他领域（site、option、cate、meta、limit、whitelist、backup、period、import、immigration、memory）可按同一清单复制执行。
