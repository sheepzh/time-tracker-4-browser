# Extension 改为 CS 架构的分析与改动步骤

## 一、现状概览

### 1. 当前架构

- **Background**：入口 `src/background/index.ts`，使用 `MessageDispatcher` 统一处理 `chrome.runtime.onMessage`，各模块通过 `dispatcher.register(ReqCode, handler)` 注册；handler 内部调用 `@service/*`（以及部分 `@db/*`）。
- **Service 层**（`src/service/`）：业务逻辑 + 访问 `@db/*`，被 **background** 和 **页面/ content-script** 共同引用。
- **Pages**（popup / app / side）：**大量直接 import `@service`**（如 `cate-service`、`option-service`、`stat-service`、`site-service`、`backup/processor`、`limit-service`、`whitelist`、`meta-service`、`option-holder`、`period-calculator`、`import-processor`、`immigration`、`week-helper`、`host-merge-ruler` 等），仅少数场景用 `sendMsg2Runtime`。
- **Content-script**：以 `trySendMsg2Runtime('cs.*')` 为主，但仍有直接引用 `@service`（如 `optionService`、`optionHolder`、`limitService`）。

因此：**业务与数据层（service + db）与 UI 强耦合**，popup/app/side 的 bundle 里会打进 service（及间接的 db）代码。

### 2. 已有“CS 雏形”

- 通信已统一：`sendMsg2Runtime(ReqCode, data)` / `onRuntimeMessage`，类型在 `types/timer/mq.d.ts`（ReqCode、Request、Response）。
- Content-script 侧多数能力已通过 `cs.*` 的 ReqCode 走 background，再由 background 调 service。
- Background 内已有按职责拆分的模块：`content-script-handler`、`limit-processor`、`track-server`、`scheduler`、`badge-manager` 等，只是尚未按“领域 service”系统化归类。

**结论：在现有消息机制上，把“所有对 service 的调用”都收口到 background，让页面和 content-script 只通过消息调用，是可行且自然的演进。**

---

## 二、目标架构（CS 解耦）

- **Server 端（仅 background）**
  - 唯一允许引用 `@service` 和 `@db` 的上下文。
  - 在 `background/` 下按领域拆分“服务模块”（如 limit、stat、site、option、backup、whitelist、meta、cate、period 等），每个模块只负责：
    - 在 `MessageDispatcher` 上注册本领域的 ReqCode；
    - 在 handler 内调用现有 `@service/*`（或必要时直接 `@db/*`）。
  - 页面和 content-script **不**再 import 任何 `@service` / `@db`。

- **Client 端（popup / app / side / content-script）**
  - 仅通过 `sendMsg2Runtime(ReqCode, data)` 与 background 通信。
  - 可引入一层 **SW API**（`src/api/sw/`）：按领域子路径（如 `@api/sw/stat`、`@api/sw/option`）导出命名函数，方法命名规范为动词+名词（如 `getOption`、`selectSite`），内部用 `requestStat` / `requestOption` 等领域 request 封装 `sendMsg2Runtime`，便于 tree-shaking，且不透出 client 概念。

- **构建与打包**
  - 仅 background 的 entry 打包 `@service` 和 `@db`；popup / app / side / content-script 的 entry 只依赖 `@api/chrome/runtime` 和上述 SW API（`@api/sw/<domain>`），不再包含 service/db 代码，实现真正的“页面与 service 解耦”。

---

## 三、可行性结论

- **技术上完全可行**：Chrome 扩展的 background 与各 page/content-script 本就隔离，现有消息通道已在使用，只需：
  - 补全“页面/CS 当前直接调用的每个 service 能力”对应的 ReqCode + handler；
  - 用 SW API（`src/api/sw/`）封装这些 ReqCode，并替换所有直接 import `@service` 的调用。
- **无需真实网络 CS**：这里的“CS”指 **进程/上下文架构**（background = 服务端，pages/CS = 客户端），不要求独立后端或 HTTP 服务。
- **可渐进迁移**：可以按“领域”或“页面”逐步替换，先加 ReqCode + handler + client 方法，再删对应 `@service` 引用。

---

## 四、可执行改动步骤

以下按顺序执行，每步都可单独验证（构建/类型检查/功能）。

---

### Phase 1：产出 ReqCode 与类型清单

**1.1 新增 ReqCode 列表（按领域）**

在 `types/timer/mq.d.ts` 的 `ReqCode` 联合类型中**先不修改**，在本阶段先产出清单表格，Phase 3 再一次性改类型文件。

| 领域 | ReqCode | 请求 data 类型 | 响应 data 类型 | 对应 service 方法/来源 |
|------|---------|----------------|----------------|------------------------|
| stat | `stat.selectSite` | `SiteQuery` (可选) | `timer.stat.SiteRow[]` | `stat-service.selectSite` |
| stat | `stat.selectSitePage` | `{ param?: SiteQuery, page?: PageQuery }` | `PageResult<SiteRow>` | `stat-service.selectSitePage` |
| stat | `stat.selectCate` | `CateQuery` (可选) | `timer.stat.CateRow[]` | `stat-service.selectCate` |
| stat | `stat.selectCatePage` | `{ query?: CateQuery, page?: PageQuery }` | `PageResult<CateRow>` | `stat-service.selectCatePage` |
| stat | `stat.selectGroup` | `GroupQuery` (可选) | `timer.stat.GroupRow[]` | `stat-service.selectGroup` |
| stat | `stat.selectGroupPage` | `{ param?: GroupQuery, page?: PageQuery }` | `PageResult<GroupRow>` 等 | `stat-service.selectGroupPage` |
| stat | `stat.listHosts` | `string` (fuzzyQuery 可选) | `Record<timer.site.Type, string[]>` | `stat-service.listHosts` |
| stat | `stat.mergeDate` | `timer.stat.SiteRow[]` | `timer.stat.SiteRow[]` | `stat-service/merge/date.mergeDate` |
| stat | `stat.batchDelete` | `timer.stat.Row[]` | `void` | `stat-service.batchDelete` |
| stat | `stat.countGroupByIds` | `{ groupIds: number[], dateRange }` | `number` | `stat-service.countGroupByIds` |
| stat | `stat.countSiteByHosts` | `{ hosts: string[], dateRange }` | `number` | `stat-service.countSiteByHosts` |
| stat | `stat.canReadRemote` | 无或空 | `boolean` | `stat-service/remote.canReadRemote` |
| stat | `stat.recommendRate` | 无 | `boolean` | `meta-service.recommendRate`（或 stat 暴露） |
| site | `site.getSite` | `timer.site.SiteKey` | `timer.site.SiteInfo` | `site-service.getSite` |
| site | `site.selectAllSites` | `SiteCondition` (可选) | `timer.site.SiteInfo[]` | `site-service.selectAllSites` |
| site | `site.selectSitePage` | `{ param?: SiteCondition, page?: PageQuery }` | `PageResult<SiteInfo>` | `site-service.selectSitePage` |
| site | `site.addSite` | `timer.site.SiteInfo` | `void` | `site-service.addSite` |
| site | `site.removeSites` | `timer.site.SiteKey[]` | `void` | `site-service.removeSites` |
| site | `site.saveSiteCate` | `{ key: SiteKey, cateId?: number }` | `void` | `site-service.saveSiteCate` |
| site | `site.batchSaveSiteCate` | `{ cateId?: number, keys: SiteKey[] }` | `void` | `site-service.batchSaveSiteCate` |
| site | `site.removeIconUrl` | `timer.site.SiteKey` | `void` | `site-service.removeIconUrl` |
| site | `site.saveSiteRunState` | `{ key: SiteKey, run: boolean }` | `void` | `site-service.saveSiteRunState` |
| site | `site.batchGetSites` | `timer.site.SiteKey[]` | `timer.site.SiteInfo[]` | `site-service.batchGetSites` |
| site | `site.batchSaveAliasNoRewrite` | `Record<string, string>` 或序列化后的 Map | `void` | `site-service.batchSaveAliasNoRewrite` |
| site | `site.removeAlias` | `timer.site.SiteKey` | `void` | `site-service.removeAlias` |
| site | `site.saveAlias` | `{ key, alias, noRewrite? }` | `void` | `site-service.saveAlias` |
| option | `option.get` | 无 | `timer.option.AllOption`(或 DefaultOption) | `option-holder.get` |
| option | `option.set` | `Partial<timer.option.AllOption>` | `void` | `option-holder.set` |
| option | `option.isDarkMode` | 无或 `AppearanceOption` | `boolean` | `option-service.isDarkMode` |
| option | `option.setDarkMode` | `AppearanceOption` | `void` | `option-service.setDarkMode` |
| option | `option.setLocale` | `LocaleOption` | `void` | `option-service.setLocale` |
| option | `option.setBackupOption` | `Partial<BackupOption>` | `void` | `option-service.setBackupOption` |
| cate | `cate.listAll` | 无 | `timer.site.Cate[]` | `cate-service.listAll` |
| cate | `cate.add` | `string` (name) | `timer.site.Cate` | `cate-service.add` |
| cate | `cate.saveName` | `{ id: number, name: string }` | `void` | `cate-service.saveName` |
| cate | `cate.remove` | `number` (id) | `void` | `cate-service.remove` |
| limit | `limit.select` | `{ filterDisabled?, url? }` | `timer.limit.Item[]` | `limit-service.select` |
| limit | `limit.remove` | `timer.limit.Item \| Item[]` | `void` | `limit-service.remove` |
| limit | `limit.updateEnabled` | `timer.limit.Item[]` | `void` | `limit-service.updateEnabled` |
| limit | `limit.updateDelay` | `timer.limit.Item` | `void` | `limit-service.updateDelay` |
| limit | `limit.updateLocked` | `timer.limit.Item` | `void` | `limit-service.updateLocked` |
| backup | `backup.syncData` | 无 | `{ success, errorMsg? }` | `backup/processor.syncData` |
| backup | `backup.checkAuth` | 无 | `{ success?, errorMsg? }` | `backup/processor.checkAuth` |
| backup | `backup.clear` | `string` (cid) | 结果 | `backup/processor.clear` |
| backup | `backup.query` | `{ specCid, start, end }` | `timer.core.Row[]` | `backup/processor.query` |
| backup | `backup.getLastBackUp` | `timer.backup.Type` | `{ ts, msg? } \| undefined` | `meta-service.getLastBackUp` |
| whitelist | `whitelist.listAll` | 无 | 白名单项列表 | `whitelist/service.listAll` |
| whitelist | `whitelist.add` | 白名单项 | `void` | `whitelist/service.add` |
| whitelist | `whitelist.remove` | 白名单项 | `void` | `whitelist/service.remove` |
| meta | `meta.saveFlag` | `{ key, value }` 或具体类型 | `void` | `meta-service.saveFlag` |
| meta | `meta.getCid` | 无 | `string \| undefined` | `meta-service.getCid` |
| meta | `meta.increaseApp` | `string` (routePath) | `void` | `meta-service.increaseApp` |
| meta | `meta.increasePopup` | 无 | `void` | `meta-service.increasePopup` |
| meta | `meta.recommendRate` | 无 | `boolean` | `meta-service.recommendRate` |
| period | `period.merge` | 入参见 period-calculator | 合并结果 | `period-calculator.merge` |
| period | `period.*` | （按 period-service 实际用法补） | - | `period-service` |
| import | `import.fillExist` | 数据格式见 import-processor | 填充后数据 | `import-processor.fillExist` |
| import | `import.processImportedData` | 导入数据 | 处理结果 | `import-processor.processImportedData` |
| immigration | `immigration.import` | 入参见 immigration | 结果 | `immigration.import` |
| db/memory | `memory.getUsedStorage` | 无 | `MemoryInfo` | `@db/memory-detector.getUsedStorage` |
| db/option | `optionDb.getOption` | 无 | option（仅 DataManage/MemoryInfo 等用） | `option-database.getOption` |
| db/stat | `statDb.select` 等 | 按 condition | 行数据 | 仅 ReportFilter/BatchDelete、Report/common、ClearPanel 等用 |
| db/site | `siteDb.*` | - | - | HostSelect、SiteManageModify、useMerge 等 |
| db/timeline | `timelineDb.*` | - | - | Dashboard Timeline |
| db/period | `periodDb.*` | - | - | Indicator |
| db/merge-rule | `mergeRuleDb.selectAll` 等 | - | - | useMerge、RuleMerge/ItemList |
| week | `week.*` | 日期/范围 | 周信息 | `week-helper`（若纯计算可保留为 util，不经过 background） |
| host-merge | `hostMerge.merge` 等 | 规则+host | merged host | `host-merge-ruler`（或走 stat.listHosts 已含合并） |
| notification | `notification.doSend` | 无 | `{ success, msg? }` | 已由 background scheduler 调，页面仅触发 reset；Footer 用 processor 可改为 `notification.trigger` 消息 |

**1.2 执行动作**

- [ ] 新建 `docs/reqcode-mapping.md`（或在本文档后附），把上表贴入并按实际代码微调每个 ReqCode 的 data 类型（从 `@service` 和 `@db` 的签名抄）。
- [ ] 对“纯计算、无 DB”的 util（如 `week-helper` 的部分方法），决定是保留在 front 的 `src/util` 还是也走消息；若走消息，在表中补一行并注明。

---

### Phase 2：Background 按领域注册 Handler

**2.1 创建目录与模块**

- [ ] 创建目录：`src/background/services/`（或 `src/background/domains/`，下文以 `services/` 为例）。
- [ ] 按领域新建文件（每个文件只做 `register`，内部 import 对应 `@service` / `@db`）：

| 文件 | 职责 |
|------|------|
| `src/background/services/stat.ts` | 注册 `stat.*` 全部 ReqCode，handler 内调 `@service/stat-service`、`stat-service/merge/date`、`@service/stat-service/remote`。 |
| `src/background/services/site.ts` | 注册 `site.*`，调 `@service/site-service`。 |
| `src/background/services/option.ts` | 注册 `option.get` / `option.set` / `option.isDarkMode` 等，调 `option-holder`、`option-service`。 |
| `src/background/services/cate.ts` | 注册 `cate.listAll` / `cate.add` / `cate.saveName` / `cate.remove`，调 `cate-service`。 |
| `src/background/services/limit.ts` | 注册 `limit.select` / `limit.remove` / `limit.updateEnabled` / `limit.updateDelay` / `limit.updateLocked` / 调 `limit-service` 及 verification processor。 |
| `src/background/services/backup.ts` | 注册 `backup.syncData` / `backup.checkAuth` / `backup.clear` / `backup.query`，调 `backup/processor`；`backup.getLastBackUp` 调 `meta-service`。 |
| `src/background/services/whitelist.ts` | 注册 `whitelist.listAll` / `whitelist.add` / `whitelist.remove`，调 `whitelist/service`。 |
| `src/background/services/meta.ts` | 注册 `meta.saveFlag` / `meta.getCid` / `meta.increaseApp` / `meta.increasePopup` / `meta.recommendRate`，调 `meta-service`。 |
| `src/background/services/period.ts` | 注册 `period.merge` 等，调 `period-calculator`、`period-service`。 |
| `src/background/services/import.ts` | 注册 `import.fillExist` / `import.processImportedData`，调 `import-processor`。 |
| `src/background/services/immigration.ts` | 注册 `immigration.import`，调 `immigration`。 |
| `src/background/services/memory.ts` | 注册 `memory.getUsedStorage`，调 `@db/memory-detector`。 |

**2.2 每个模块的模板**

每个文件统一形状，例如 `stat.ts`：

```ts
import type MessageDispatcher from "../message-dispatcher"
import { selectSite, selectSitePage, selectCate, ... } from "@service/stat-service"
import { mergeDate } from "@service/stat-service/merge/date"

export default function initStatService(dispatcher: MessageDispatcher) {
  dispatcher
    .register<timer.stat.SiteQuery | undefined, timer.stat.SiteRow[]>('stat.selectSite', param => selectSite(param))
    .register('stat.selectSitePage', ({ param, page }) => selectSitePage(param, page))
    // ... 其余 stat.*
}
```

**2.3 挂到 background 入口**

- [ ] 打开 `src/background/index.ts`。
- [ ] 在 `messageDispatcher.start()` 之前，按顺序调用：
  - `initStatService(messageDispatcher)`
  - `initSiteService(messageDispatcher)`
  - `initOptionService(messageDispatcher)`
  - `initCateService(messageDispatcher)`
  - `initLimitService(messageDispatcher)`
  - `initBackupService(messageDispatcher)`
  - `initWhitelistService(messageDispatcher)`
  - `initMetaService(messageDispatcher)`
  - `initPeriodService(messageDispatcher)`
  - `initImportService(messageDispatcher)`
  - `initImmigrationService(messageDispatcher)`
  - `initMemoryService(messageDispatcher)`
- [ ] 若现有 `content-script-handler`、`limit-processor`、`track-server` 里已有对同一 ReqCode 的注册，保留一处即可（建议保留在 `services/*`，从原文件删掉重复 register）。

**2.4 校验**

- [ ] 运行 `npm run build`（或 `rspack` 构建），确认无类型错误。
- [ ] 在 background 控制台确认无重复 register 报错。

---

### Phase 3：扩展 mq 类型

**3.1 修改 ReqCode 联合类型**

- [ ] 打开 `types/timer/mq.d.ts`。
- [ ] 在 `type ReqCode =` 的联合类型中，追加 Phase 1 表中所有新 code（如 `'stat.selectSite'`、`'stat.selectSitePage'`、…、`'memory.getUsedStorage'` 等）。

**3.2（可选）请求/响应类型**

- [ ] 若希望严格类型，可在 `types/timer/` 下新增 `runtime-api.d.ts`，为每个 ReqCode 声明 `RequestData[Code]` 和 `ResponseData[Code]`，供 background handler 与 sw 模块共用；本阶段至少保证 ReqCode 字面量齐全。

---

### Phase 4：实现 SW API（src/api/sw/）

**4.1 目录与约定**

- [x] 使用 `src/api/sw/`，无统一 index；页面按领域从 `@api/sw/<domain>` 子路径导入（如 `@api/sw/stat`、`@api/sw/option`）。
- [x] 各领域文件内用「动词+名词」的 request 变量（如 `requestStat`、`requestOption`）封装 `sendMsg2Runtime`，方法命名规范为动词+名词（如 `getOption`、`setOption`、`selectLimits`、`removeLimit`），不透出 client 概念。

**4.2 按领域建 sw 模块**

每个模块只依赖 `@api/chrome/runtime` 的 `sendMsg2Runtime`，不依赖 `@service` / `@db`。

| 文件 | 导出（动词+名词） |
|------|------|
| `src/api/sw/stat.ts` | `selectSite`, `selectSitePage`, `selectCate`, `selectCatePage`, `selectGroup`, `selectGroupPage`, `listHosts`, `mergeDate`, `batchDelete`, `countGroupByIds`, `countSiteByHosts`, `canReadRemote`, `recommendRate` |
| `src/api/sw/site.ts` | `getSite`, `selectAllSites`, `selectSitePage`, `addSite`, `removeSites`, `saveSiteCate`, `batchSaveSiteCate`, `removeIconUrl`, `saveSiteRunState`, `batchGetSites`, `batchSaveAliasNoRewrite`, `removeAlias`, `saveAlias` |
| `src/api/sw/option.ts` | `getOption`, `setOption`, `isDarkMode`, `setDarkMode`, `setLocale`, `setBackupOption` |
| `src/api/sw/cate.ts` | `listCates`, `addCate`, `saveCateName`, `removeCate` |
| `src/api/sw/limit.ts` | `selectLimits`, `removeLimit`, `updateEnabled`, `updateDelay`, `updateLocked`, `verifyLimit`, `updateLimit`, `createLimit` |
| `src/api/sw/backup.ts` | `syncData`, `checkAuth`, `clearBackup`, `queryBackup`, `getLastBackUp`, `listBackupClients` |
| `src/api/sw/whitelist.ts` | `listWhitelist`, `addWhitelist`, `removeWhitelist` |
| `src/api/sw/meta.ts` | `saveFlag`, `getCid`, `increaseApp`, `increasePopup`, `recommendRate` |
| `src/api/sw/period.ts` | `mergePeriod` |
| `src/api/sw/import.ts` | `fillExist`, `processImportedData` |
| `src/api/sw/immigration.ts` | `importData`, `exportData` |
| `src/api/sw/memory.ts` | `getUsedStorage` |

**4.3 示例实现（stat 两则）**

```ts
// src/api/sw/stat.ts
const requestStat = <T, R>(code: string, data?: T) => sendMsg2Runtime<T, R>(`stat.${code}` as timer.mq.ReqCode, data)

export function selectSite(param?: SiteQuery) {
  return requestStat<SiteQuery | undefined, timer.stat.SiteRow[]>('selectSite', param)
}
export function selectSitePage(param?: SiteQuery, page?: timer.common.PageQuery) {
  return requestStat('selectSitePage', { param, page })
}
```

注意：若 `SiteQuery` 等类型定义在 `@service` 中，使用 `import type` 从 types 或 service 引用，确保 sw 不打包 service 实现。

**4.4 校验**

- [ ] 确保 `src/api/sw/` 下无 `from '@service'` 或 `from '@db'`（仅允许 `import type`）。
- [ ] 构建后确认 popup/app/side 的 chunk 不包含 stat-service、site-service 等大块实现。

---

### Phase 5：按文件替换页面与 content-script 的 @service / @db

按文件逐项替换，每改完一个文件可保存并跑一次类型检查。

**5.1 Pages（app）**

| 文件 | 当前 import | 改为 | 调用处改动要点 |
|------|-------------|------|----------------|
| `src/pages/app/context.ts` | `cateService` | `import { listCates } from '@api/sw/cate'` | `cateService.listAll()` 保持不变（client 方法同签名） |
| `src/pages/app/index.ts` | `optionService` | `@api/sw/option`（如 `getOption`, `setOption`, `isDarkMode`） | 同左 |
| `src/pages/app/router/index.ts` | `increaseApp` from meta-service | `import { increaseApp } from '@api/sw/meta'` | 同上 |
| `src/pages/app/components/Analysis/context.ts` | `selectCate`, `selectSite` from stat-service | `import { selectCate, selectSite } from '@api/sw/stat'` | 不变 |
| `src/pages/app/components/Analysis/components/Summary/TargetInfo.tsx` | `getSite` from site-service | `getSite` from `@api/sw/site` | 不变 |
| `src/pages/app/components/Analysis/components/Summary/Calendar/Wrapper.ts` | weekHelper | 若 week 走消息则 `@api/sw/period` 等，否则保留 `@service/components/week-helper` 或迁到 `@util` | 按 1.2 决策 |
| `src/pages/app/components/Analysis/components/AnalysisFilter/TargetSelect.tsx` | selectAllSites, listHosts | `selectAllSites` from `@api/sw/site`，`listHosts` from `@api/sw/stat` | 不变 |
| `src/pages/app/components/Dashboard/index.tsx` | recommendRate, saveFlag from meta-service | `@api/sw/meta`（如 `saveFlag`, `recommendRate`） | 不变 |
| `src/pages/app/components/Dashboard/components/Calendar/Wrapper.ts` | weekHelper, selectSite | week 走 sw 或 util；`selectSite` from `@api/sw/stat` | 同上 |
| `src/pages/app/components/Dashboard/components/Calendar/index.tsx` | selectSite, weekHelper | `selectSite` from `@api/sw/stat`；week 同上 | 不变 |
| `src/pages/app/components/Dashboard/components/Indicator.tsx` | periodDatabase, selectSite | memory/stat client 或新 ReqCode 暴露 period 聚合结果；`selectSite` from `@api/sw/stat` | 避免直接 @db，改为消息 |
| `src/pages/app/components/Dashboard/components/MonthOnMonth/index.tsx` | selectSite | `selectSite` from `@api/sw/stat` | 不变 |
| `src/pages/app/components/Dashboard/components/Timeline/index.tsx` | timelineDatabase | 新增 ReqCode（如 `timeline.query`）在 background 读 timeline db，client 调用 | 不变 |
| `src/pages/app/components/Dashboard/components/Timeline/Chart/useMerge.ts` | mergeRuleDatabase, siteDatabase, CustomizedHostMergeRuler | 新 ReqCode（如 `mergeRule.list` + `site.batchGet`）或 hostMerge 结果由 stat 暴露；或 background 提供 `merge.getMergedHosts` | 改为 client 调用 |
| `src/pages/app/components/Dashboard/components/TopKVisit/context.ts` | selectSitePage, SiteQuery from stat-service | `selectSite` from `@api/sw/stat`Page；类型从 types 或 stat-client 导出 | 不变 |
| `src/pages/app/components/Habit/components/Period/context.ts` | merge, periodService | periodClient.merge；periodClient 其他方法 | 不变 |
| `src/pages/app/components/Habit/components/Site/context.ts` | selectSite, mergeDate | `selectSite` from `@api/sw/stat`, statClient.mergeDate | 不变 |
| `src/pages/app/components/Limit/context.ts` | limitService | limitClient | limitService.select/remove/updateEnabled/updateDelay/updateLocked 改为 limitClient.* |
| `src/pages/app/components/Limit/common.ts` | optionHolder | optionClient.get | 不变 |
| `src/pages/app/components/Limit/components/Table/index.tsx` | weekHelper | 同 1.2 | 不变 |
| `src/pages/app/components/Limit/components/Test.tsx` | limitService | limitClient.select | 不变 |
| `src/pages/app/components/Limit/components/Modify/index.tsx` | limitService | limitClient | 同 Limit/context |
| `src/pages/app/components/Option/useOption.ts` | optionHolder | `getOption` / `setOption` from `@api/sw/option` | 不变 |
| `src/pages/app/components/Option/export-import.ts` | optionHolder | `getOption` / `setOption` from `@api/sw/option` | 不变 |
| `src/pages/app/components/Option/categories/Appearance/index.tsx` | optionService | `isDarkMode`, `setDarkMode` from `@api/sw/option` | 不变 |
| `src/pages/app/components/Option/categories/Backup/Footer.tsx` | processor, getLastBackUp | backupClient.syncData, backupClient.getLastBackUp（或 `@api/sw/meta`（如 `saveFlag`, `recommendRate`）.getLastBackUp） | 不变 |
| `src/pages/app/components/Option/categories/Backup/ClientTable.tsx` | processor, getCid | backupClient 相关 + `@api/sw/meta`（如 `saveFlag`, `recommendRate`）.getCid | 不变 |
| `src/pages/app/components/Option/categories/Backup/Clear/Step1.tsx` | processor | backupClient.query | 不变 |
| `src/pages/app/components/Option/categories/Backup/Clear/Sop.tsx` | processor | backupClient.clear | 不变 |
| `src/pages/app/components/Option/categories/Backup/Download/Sop.tsx` | processor, processImportedData | backupClient + importClient.processImportedData | 不变 |
| `src/pages/app/components/Option/categories/Limit/useVerify.ts` | limitService | limitClient.verify | 不变 |
| `src/pages/app/components/Option/categories/Notification/Footer.tsx` | processor | 改为 `trySendMsg2Runtime('resetNotificationScheduler')` 或新 code `notification.trigger` | 不变 |
| `src/pages/app/components/Option/categories/Tracking.tsx` | immigration | immigrationClient（或保留 sendMsg2Runtime('enableTabGroup')） | 不变 |
| `src/pages/app/components/Report/common.ts` | statDatabase, selectCate/selectCatePage/selectGroup/selectGroupPage/selectSite/selectSitePage | 若 statDatabase 仅用于类型，改为从 types 引；查询一律 `@api/sw/stat` 命名函数 | 不变 |
| `src/pages/app/components/Report/ReportFilter/BatchDelete.tsx` | statDatabase, batchDelete, countGroupByIds, countSiteByHosts | `batchDelete`, `countGroupByIds`, `countSiteByHosts` from `@api/sw/stat` | 不变 |
| `src/pages/app/components/Report/ReportFilter/RemoteClient.tsx` | canReadRemote | `canReadRemote` from `@api/sw/stat` | 不变 |
| `src/pages/app/components/Report/ReportTable/index.tsx` | removeAlias, saveAlias, selectCate, selectGroup, selectSite | `@api/sw/site` + `@api/sw/stat` 命名函数 | 不变 |
| `src/pages/app/components/Report/ReportTable/columns/OperationColumn.tsx` | whitelistService | whitelistClient | 不变 |
| `src/pages/app/components/SiteManage/index.tsx` | batchSaveSiteCate, removeSites | `batchSaveSiteCate`, `removeSites` from `@api/sw/site` | 不变 |
| `src/pages/app/components/SiteManage/SiteManageTable/index.tsx` | removeIconUrl, saveSiteRunState | `removeIconUrl`, `saveSiteRunState` from `@api/sw/site` | 不变 |
| `src/pages/app/components/SiteManage/SiteManageTable/column/AliasColumn.tsx` | batchGetSites, batchSaveAliasNoRewrite, removeAlias, saveAlias | 同上 from `@api/sw/site` | 不变 |
| `src/pages/app/components/SiteManage/SiteManageTable/column/OperationColumn.tsx` | removeSites | `removeSites` from `@api/sw/site` | 不变 |
| `src/pages/app/components/SiteManage/SiteManageModify/index.tsx` | siteDatabase, addSite | `addSite` from `@api/sw/site`；exist 检查可改为 `getSite` | 不变 |
| `src/pages/app/components/SiteManage/SiteManageModify/HostSelect.tsx` | siteDatabase, listHosts | `listHosts` from `@api/sw/stat`；host 列表若需从 site 来则 `selectAllSites` from `@api/sw/site` 或新 code | 不变 |
| `src/pages/app/components/SiteManage/useSiteManage.ts` | selectSitePage, SiteQueryParam | `selectSitePage` from `@api/sw/site`；类型从 types | 不变 |
| `src/pages/app/components/common/category/CategoryEditable.tsx` | saveSiteCate | `saveSiteCate` from `@api/sw/site` | 不变 |
| `src/pages/app/components/common/category/CategorySelect/OptionItem.tsx` | cateService, selectAllSites | `listCates`/`addCate` from `@api/sw/cate`，`selectAllSites` from `@api/sw/site` | 不变 |
| `src/pages/app/components/common/category/CategorySelect/SelectFooter.tsx` | cateService | cateClient.add | 不变 |
| `src/pages/app/components/Whitelist/WhitePanel/index.tsx` | whitelistService | whitelistClient | 不变 |
| `src/pages/app/components/Whitelist/WhitePanel/WhiteInput.tsx` | selectAllSites | `selectAllSites` from `@api/sw/site` | 不变 |
| `src/pages/app/components/DataManage/context.ts` | getUsedStorage, MemoryInfo | memoryClient.getUsedStorage | 不变 |
| `src/pages/app/components/DataManage/Migration/index.tsx` | immigration | immigrationClient | 不变 |
| `src/pages/app/components/DataManage/Migration/ImportButton.tsx` | immigration | immigrationClient | 不变 |
| `src/pages/app/components/DataManage/Migration/ImportOtherButton/Sop.tsx` | processImportedData | importClient.processImportedData | 不变 |
| `src/pages/app/components/DataManage/Migration/ImportOtherButton/processor.ts` | fillExist | importClient.fillExist | 不变 |
| `src/pages/app/components/DataManage/MemoryInfo.tsx` | optionDatabase | `getOption` from `@api/sw/option`（由 background 读 option db） | 不变 |
| `src/pages/app/components/DataManage/ClearPanel/index.tsx` | db, StatCondition from stat-database | `@api/sw/stat` 查询 + 删除；类型从 types | 不变 |
| `src/pages/app/components/RuleMerge/ItemList.tsx` | mergeRuleDatabase | 新 ReqCode mergeRule.list 等，mergeRuleClient | 不变 |
| `src/pages/app/components/About/Description.tsx` | saveFlag | `@api/sw/meta`（如 `saveFlag`, `recommendRate`）.saveFlag | 不变 |
| `src/pages/app/components/Option/categories/Backup/Download/Sop.tsx` | fillExist, processImportedData | importClient | 已列在上表 |

**5.2 Pages（popup）**

| 文件 | 当前 import | 改为 |
|------|-------------|------|
| `src/pages/popup/context.ts` | cateService, optionService | `listCates` from `@api/sw/cate`，`isDarkMode`/`setDarkMode` from `@api/sw/option` |
| `src/pages/popup/index.ts` | increasePopup, optionService | `increasePopup` from `@api/sw/meta`，`isDarkMode` from `@api/sw/option` |
| `src/pages/popup/common.tsx` | weekHelper, selectCate, selectGroup, selectSite | week 按 1.2；`selectCate`/`selectGroup`/`selectSite` from `@api/sw/stat` |
| `src/pages/popup/components/Header/LangSelect.tsx` | optionHolder, optionService | `getOption`, `setLocale` from `@api/sw/option` |
| `src/pages/popup/components/Header/MoreInfo.tsx` | saveFlag | `@api/sw/meta`（如 `saveFlag`, `recommendRate`）.saveFlag |
| `src/pages/popup/components/Percentage/Cate/Wrapper.ts` | cateService, mergeDate | `listCates` from `@api/sw/cate`，`mergeDate` from `@api/sw/stat` |

**5.3 Pages（side）**

| 文件 | 当前 import | 改为 |
|------|-------------|------|
| `src/pages/side/index.ts` | optionService | `@api/sw/option` |
| `src/pages/side/Layout.tsx` | selectSite | `selectSite` from `@api/sw/stat` |
| `src/pages/side/components/Search/useDatePicker.ts` | selectSite | `selectSite` from `@api/sw/stat` |

**5.4 Hooks（pages 下）**

| 文件 | 当前 import | 改为 |
|------|-------------|------|
| `src/pages/hooks/useEcharts.ts` | optionHolder | `getOption` from `@api/sw/option` |
| `src/pages/hooks/useSiteMerge.ts` | optionHolder | `getOption` from `@api/sw/option` |

**5.5 Content-script**

| 文件 | 当前 import | 改为 |
|------|-------------|------|
| `src/content-script/limit/modal/context.ts` | limitService | limitClient（或 trySendMsg2Runtime('cs.getLimitedRules'/'cs.getRelatedRules') 若已有） |
| `src/content-script/limit/modal/index.ts` | optionService | `@api/sw/option` |
| `src/content-script/limit/modal/components/Footer.tsx` | optionHolder, trySendMsg2Runtime | `getOption` from `@api/sw/option`；保留 trySendMsg2Runtime 用于 openAnalysis/openLimit 等 |
| `src/content-script/limit/modal/components/Alert.tsx` | optionHolder | `@api/sw/option` |
| `src/content-script/limit/reminder/index.ts` | optionService | `@api/sw/option` |
| `src/content-script/tracker/normal/idle-detector.ts` | optionHolder, trySendMsg2Runtime | `@api/sw/option`；保留 trySendMsg2Runtime 用于 cs.getAudible |

**5.6 收尾校验**

- [ ] 全仓库执行：`rg "from ['\"]@service|from ['\"]@db" src/pages src/content-script`，结果应为空。
- [ ] `npm run build` 通过；必要时 `tsc --noEmit`。

---

### Phase 6：构建与产物校验

**6.1 构建**

- [ ] `npm run build`（或 `rspack --config=rspack/rspack.prod.ts`）成功。

**6.2 产物检查**

- [ ] 检查 dist 下 background 的 js：应包含 stat-service、site-service 等关键字（或大体积）。
- [ ] 检查 popup/app/side 的 js：不应包含 `siteDatabase`、`statDatabase`、`optionHolder` 等实现代码（或明显小于改前）。
- [ ] 若使用 rspack 的 splitChunks，确认没有把 `@service`/`@db` 打进与 pages 共用的 chunk。

**6.3 功能回归清单**

- [ ] Popup：打开、今日统计、分类/分组/站点维度切换、设置项保存、语言切换。
- [ ] App：仪表盘、分析、习惯、限时、站点管理、分类、白名单、报表、数据管理（备份/恢复/迁移/清理）、选项（外观/追踪/备份/通知/限时等）。
- [ ] Side panel：搜索、日期筛选、结果展示。
- [ ] Content-script：限时弹窗、今日信息打印、run time 统计、idle、timeline 事件上报。

---

### Phase 7（可选）：Background 内部领域化

- [ ] 将 `content-script-handler.ts`、`limit-processor.ts`、`track-server/index.ts` 中“仅调 service 的逻辑”迁到 `background/services/*` 对应文件，原文件只保留与 tab/url/UI 流程相关的分支（如 openAnalysis、openLimit、onInjected）。
- [ ] 保持 `messageDispatcher.start()` 前所有 `init*Service(dispatcher)` 的调用顺序不变。

---

### Phase 8：文档与规范

- [ ] 在 README 或 `docs/architecture.md` 中写明：仅 background 可引用 `@service` 和 `@db`；新能力通过 ReqCode + background handler + Runtime Client 暴露。
- [ ] （可选）ESLint：在 `src/pages`、`src/content-script` 下禁止 `import` 路径包含 `@service`、`@db`（可用 `no-restricted-imports` 或 eslint-plugin 的 path 规则）。

---

## 五、风险与注意点

- **消息序列化**：Chrome 的 `sendMessage` 会做 JSON 序列化，不能传函数、Symbol、不可序列化对象。复杂参数/返回值需保证可 JSON 序列化（当前代码已多用 plain object，需保持）。
- **异步与错误**：所有 client 方法都是异步的，且依赖 background 存活；扩展 reload/升级后，已有页面或 CS 的“旧 context”可能暂时收不到回复，现有 `trySendMsg2Runtime` 等已有一定防护，Client API 层可统一用相同策略。
- **性能**：每次操作都经消息通道，会有一定延迟；若某页面存在“高频、批量”调用（如表格逐行查 site），可考虑在 background 增加批量 ReqCode（如 `site.batchGet`），减少往返次数。
- **测试**：background 的 handler 可单测（直接调 handler 函数）；页面/CS 侧可 mock `sendMsg2Runtime` 或 Runtime Client，便于单元测试。

---

## 六、小结

- **能否完全改成 CS 架构**：可以；把“所有 service 调用”都收口到 background，页面和 content-script 只通过消息调用即可。
- **核心改动**：
  1）补全 ReqCode 与类型；
  2）在 background 按领域拆分并注册 handler，handler 内调现有 service；
  3）实现 Runtime Client API，替换页面/CS 中所有对 `@service`（及 `@db`）的直接引用；
  4）构建与规范上保证只有 background 依赖 service/db。
按上述步骤分阶段做，即可在不大改业务逻辑的前提下，把 extension 做成“逻辑与数据仅在 background、页面与 content-script 纯客户端”的 CS 架构。
