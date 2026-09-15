# Spark 架构详解与核对记录

核对日期：2026-09-15。范围：当前本地工作树，包含尚未推送的宿主与子模块修改。本文与根 README 配套，不把历史接入记录中的测试结果直接视为本轮验证。

## 先用一句话理解

**发现界面负责找到一个值得讨论的合作方向；项目层负责保存双方资料与意向；COLLIDER 负责把这些上下文带入对话和物料生产；Provider 负责实际模型调用。**

[打开交互式架构图](../output/architecture/2026-09-15/spark.html)。图为 `architecture` 类型，主线从左向右，支线表示本地规则、原生画板、存储和独立生图通道。它是组件职责概览，省略了重复的 HTTP 调用和存储边，不是逐请求时序图。图例中的「数据库」是 Archify 的存储类别；图中实际使用的是浏览器存储与本机文件，并无已部署的数据库服务。

## 为什么分成这些层

### 品牌发现层

用户先描述自己的品牌，再观察伙伴。`App` 分别维护自己的品牌、当前聚焦品牌、选中品牌与页面状态。

例如，点击奶龙查看详情，只改变检查对象；主动聚焦奶龙，才切换到奶龙作为中心的关系世界。这样避免用户拖动画面或查看说明时，整个匹配上下文意外改变。

角色、发型、配饰用来帮助理解与区分资料，不作为独立的商业能力认证。上传资料不足时，应体现缺口和待验证状态。

### 规则与空间层

数据适配器提供已加载品牌快照与关系结果。关系引擎对资料评分；发现逻辑判断哪些线索有一定依据；布局引擎把结果排成可探索的空间；视口逻辑负责显示细节。

这些层分开后，更换关系计算方式不必同时重写拖拽和渲染。未来接入远程关系服务，需要先加载、校验与缓存，再满足当前同步的 `WorldDataSource` 契约，不能直接把异步网络请求塞进已有同步方法。

### 项目层

一段合作不能只剩分数。项目保存双方品牌快照、视觉来源、简报、发布渠道、预演版本、邀请状态、双方确认与备注。

`sequence` 用于识别并发更新冲突，`revision` 表示简报/物料版本。用户修改简报后，旧版本确认不应自动覆盖新内容。当前状态机表达的是本机演示流程，未连接真实邀请发送或对方身份验证。

### 画板适配层

宿主 `Project` 与原画板的 `ProductionProject` 不是同一数据结构。`productionProject()` 把简报转为策略节点、双方资料转为文档节点、已有渠道图转为图片资产。

`RelationsProductionRepository` 让原画板通过熟悉的仓库接口读取这些项目。`POST /api/canvas/open` 再按项目 ID 与简报版本恢复会话。界面可以直接复用原生产画板，不必另做一套画布组件。

画板通过 Vite 中间件接入原 HTTP router；架构图中的运行时是逻辑组件，不代表额外部署了一台独立服务器。

### 模型与生成层

当前存在几条不同路径：

1. 角色参数 API：生成经校验的结构化角色数据，由前端绘制。
2. 轻量文字 Provider：资料理解、单字段建议、快速提案等。
3. 原 COLLIDER runtime：维护会话和多阶段任务，按配置获得文字、图片与相应工具能力。
4. 本机 `CanvasDemoService`：面向当前演示的顺序图片队列，调用 `CodexImageProvider` 后把成功结果补入画板。

第 4 条是与原 runtime 图片服务并存的独立通道。它通过 `/api/canvas/demo`、`/api/canvas/demo/generate` 和图片资产接口工作，并非先走完整多轮研究再出图。README 因此分别说明两条路径，避免把局部图片能力与整条自动生产链路混为一谈。

## 走一次实际流程

### A. 使用预载案例

1. 用户浏览库迪资料与角色，在伙伴详情选择奶龙。
2. `isCottiNailongPair()` 判断该演示组合，直接使用固定预载项目 ID。
3. `ProjectStore` 提供预载项目，静态 PNG 从 `public/collaboration/cotti-nailong/` 读取。
4. 画板入口请求会话映射，恢复已有会话或创建新会话。
5. 原画板显示双方资料、简报和两张历史概念图；这一步没有重新生图。
6. 用户主动提交讨论或生图要求后，才进入对应模型路径。

该路径专门降低现场演示对模型等待和历史本机会话的依赖。它证明的是预载数据能够贯通界面和画板，不能证明案例配对是客观最优，也不能证明真实品牌已经合作。

### B. 使用自建品牌与普通伙伴

1. 用户手动录入或上传资料，必要时通过模型理解并核对引用。
2. 品牌对象进入当前会话；符合自建公司保存条件的角色写入浏览器本地存储。
3. 规则引擎计算关系，发现逻辑标注线索与探索对象。
4. 选择伙伴并申请建联，项目 API 保存新的双方快照与预演。
5. 宿主把新项目适配到原画板，会话和项目记录保存在本机目录。
6. 当前渠道预演以发布方视觉为主。视觉资料不足时使用待补充/中性占位，不能当成已取得官方 VI。

### C. 本机限额生图

生成面板提交项目、要求、数量、发布方和请求 ID → 校验输入与能力 → 去重及预算预留 → 保存输入 → 逐张调用 Provider → 保存状态快照与图片元数据 → 补入画板资产。

任一张结果不明时，后续排队图片停止。服务重启会把进行中的结果标为未知，不直接重新发送。预算按同一演示目录累计，因此换项目或重启服务不会自动获得新的演示预算。

## 代码证据索引

| 说明 | 核对文件 / 标识 |
| --- | --- |
| 双 HTML 入口、Vite API 插件 | `vite.config.ts` |
| 首页与实验页分流 | `src/main.tsx` |
| 页面、Focus、选择、案例特判 | `src/App.tsx`：`readRoute`、`startInvitation` |
| 品牌数据适配契约 | `src/domain/types.ts`、`src/data/source.ts` |
| 演示锚点与虚构样本合并 | `src/data/mockBrands.ts`：`generateMockBrands` |
| 五维评分及权重 | `src/engines/relation.ts`、`src/config.ts` |
| 资料缺口与探索候选 | `src/domain/discovery.ts` |
| 分数/排名混合半径与避碰 | `src/engines/gravity.ts`：`distanceTargets`、`calculateGravityPositions` |
| 视口及细节降级 | `src/engines/viewport.ts`、`src/hooks/useViewport.ts` |
| 品牌角色本地存储 | `src/engines/characterGenome.ts` |
| 上传限制与原文证据 | `server/brandDocuments.ts`、`src/domain/brandProfile.ts` |
| 项目状态及版本约束 | `src/collaboration/model.ts`、`server/projectsApi.ts` |
| 固定案例及历史 AI 图标记 | `src/collaboration/preloadedProject.ts` |
| 原生画板入口 | `src/collaboration/canvas-entry.tsx` |
| Project / ProductionProject 转换及会话链接 | `server/canvasIntegration.ts` |
| Provider 初始化及 runtime | `server/colliderApi.ts` |
| 本机图片预算及追加快照 | `server/canvasDemo.ts` |
| 本机图片能力探测与结果校验 | `server/codexImageProvider.ts` |
| 原画板与运行时 | `integrations/collider/brand-collider-skills-design/web/`、`src/server/` |

## API 分组

| 分组 | 代表入口 | 作用 |
| --- | --- | --- |
| 角色 | `GET /api/character/status`、`POST /api/character/generate` | 角色参数能力及生成 |
| 资料与提案 | `POST /api/collider/uploads`、`/analyze-brand`、`/quick-proposal` | 解析、理解与初稿 |
| 宿主项目 | `GET/POST /api/projects`、`/api/projects/:id/...` | 项目与版本操作 |
| 画板打开 | `POST /api/canvas/open` | 会话创建/恢复 |
| 原生运行时 | `/api/runtime`、`/api/sessions`、`/api/production`、`/api/uploads` | 委托原 router 处理 |
| 本机图片演示 | `GET /api/canvas/demo`、`POST /api/canvas/demo/generate` | 预算、提交与状态 |

表中省略方法的路径不是对任意 HTTP 方法的承诺；具体请求格式与路由以实现为准。多数组合 API 是本机同源接口，不是公开互联网 API。

## 本次核对与验证

本次仅编辑文档并生成架构说明，不修改业务逻辑，不发起真实模型请求。运行现有工程检查用来报告本地代码状态；结果补充在下方。所有命令日志和架构 QA 证据保存在 `output/architecture/2026-09-15/`。

## 案例说明与发布边界

奶龙 × 库迪案例仅用于项目介绍和非商业运行演示，不代表真实合作、商业使用、官方授权或确定匹配。预载组合、文案、角色和图片的演示性质应与导出内容一起保留。

当前根工作树在文档工作开始前已有画板入口、服务适配和新增生图代码，子模块也有未提交改动。本文记录这些现有实现，但不把它们描述为已发布到 GitHub 的功能。本次经用户确认，以 Spark 名称同步文档与项目命名；既有画板开发修改和子模块改动保留在本地，不纳入此次信息更新。

### 本轮检查结果

| 检查 | 结果 |
| --- | --- |
| 现有 Vitest 套件 | 36 个测试文件、158 项测试通过 |
| TypeScript 类型检查 | 通过 |
| 双入口构建 | 通过 |
| 全仓库 lint | 未通过：1283 个错误，位于已有 `.codex-build/` 脚本和 `tmp/` 历史构建资源 |
| 定向源码 lint：`src server vite.config.ts` | 通过 |
| README / 架构文档本地链接 | 通过 |
| 架构图确定性检查 | showcase 9/9，0 errors，0 warnings |
| 架构图自动浏览器证据 | 通过，1440×900、1600×1000、1920×1080、2048×1320 无页面溢出 |
| 架构图图像复核 | 已查看大尺寸浅色和 1440×900 深色截图，文字与连线未见遮挡 |

运行检查使用本机提供的 Node/pnpm 工具；可用的 pnpm 执行器报告 11.19.0，未单独复测声明的 10.11.0 安装路径。本轮没有修改包管理器声明或锁文件，没有验证真实 AI 账号调用，也没有重跑完整产品交互旅程。

架构图交付收据：`output/architecture/2026-09-15/spark-delivery.json`。自动浏览器证据与人工图像判断分别保存，机器回执中的 `visualReview: pending` 保持原样；人工复核不改写自动证据。
