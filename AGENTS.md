# AGENTS.md — AlgoNoteHelper

给接手本仓库的 AI / Agent 的总览。细节以 `.cursor/rules/*` 与 `openspec/specs/*` 为准；本文件避免大段重复，只保留开工必需上下文。

维护者：大二本科生；解释概念时要清楚、有结构，但**不要为省事编造或简化到错误**。

---

## 1. 产品是什么

私有算法刷题笔记库：

| 路径 | 做什么 |
|---|---|
| **Path 1 · Filter** | 按标签 / 难度 / 标题 / 练习日期浏览目录 |
| **Path 2 · Ask** | 向量检索 → 建 grounding 池 → **只基于用户自己的笔记** 回答 |

- 线上：`https://algonote.keyneswu.com`（HTTPS + Cloudflare）
- **无公开注册**；首个管理员走 `/setup`；之后由管理员在 Settings 建用户
- UI：应用内页（Notes / Ask / Import / Settings）保持 **HeroUI v3**；`/` 为营销落地页；`/login`、`/setup` 可用 `.atmosphere` 氛围背景
- **不要**再做全站 shadcn 迁移；曾探索的 `shadcn-ui-and-landing` 已放弃并归档

更多近况见 [`.cursor/rules/project-status.mdc`](.cursor/rules/project-status.mdc)。

---

## 2. 技术栈

| 层 | 技术 |
|---|---|
| Frontend | Next.js (App Router) · React · **HeroUI v3** · Tailwind · next-intl · assistant-ui · CodeMirror |
| Auth | Better Auth（email/password + admin）· Next BFF → FastAPI（`X-User-Id` + `X-Internal-Secret`） |
| API | FastAPI · SQLAlchemy 2 · Alembic · Pydantic Settings |
| Data | PostgreSQL 17 + pgvector |
| AI | BYOK（Settings 里配 chat / embedding）；可选 DeepSeek / DashScope 等 |
| 工具 | Docker Compose · **uv**（Python）· **pnpm**（Node） |

身份模型：会话在 Next/Better Auth；笔记所有权以 FastAPI 的 user id 为准，**admin 不能绕过他人笔记**。

---

## 3. 仓库地图（常用）

```text
frontend/          Next.js 应用（src/app：/, login, setup, notes, ask, import, settings）
api/ 或 app/       FastAPI（以仓库实际布局为准）
openspec/specs/    已落地能力的规格真相源
openspec/changes/  进行中的变更；完成后进 archive/
.cursor/rules/     始终生效的项目规则（status、测试账号等）
.cursor/skills/    OpenSpec explore / propose / apply / archive
docs/screenshots/  README 用截图
```

环境变量：复制 `.env.example` → `.env`（勿提交）。生产域名相关：`BETTER_AUTH_URL`、`NEXT_PUBLIC_APP_URL`、`CORS_ORIGINS`。

---

## 4. 硬约束（包管理与 UI）

- **Python**：优先 **uv**（`uv sync` / `uv run` / `uv add`）。不要用全局 pip 或手建 venv，除非用户明确要求；已有 `environment.yml` 且用户未要求迁移时再考虑 conda。
- **Node**：优先 **pnpm**（`pnpm install` / `pnpm add` / `pnpm dlx`）。不要擅自改成 npm/yarn。
- **UI**：应用 chrome 与业务页保持 **HeroUI**；落地页/登录可 polish，但不要引入全站 `components/ui` shadcn 体系替换。
- **生产数据**：假定线上有真实用户；禁止建议 `docker compose down -v`、删 `pgdata`、乱改防火墙等破坏性操作，除非用户明确要求。

---

## 5. 本地开发（摘要）

```bash
# 数据库
docker compose up db -d

# API（仓库根或 api 目录，按项目脚本）
uv sync
uv run uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend && pnpm install && pnpm dev
```

- App：`http://localhost:3000` · API health：`http://localhost:8000/health`
- 首次：无用户时进 `/setup` → 登录 → Settings 校验 BYOK
- 前端测试：`cd frontend && pnpm test` / `pnpm lint`

更完整步骤见 [`README.md`](README.md)。

---

## 6. 生产部署与服务器

优先 **手动 SSH**；GitHub Actions 的 SSH deploy **不可靠**，不要默认依赖 CD，除非用户要修它。

| 项 | 值 |
|---|---|
| 用户 | `ubuntu` |
| Tailscale IP（优先） | `100.73.46.33` |
| 公网 IP（备选） | `43.155.145.80` |

```bash
ssh ubuntu@100.73.46.33          # Tailscale 优先
# ssh ubuntu@43.155.145.80       # Tailscale 不可用时
cd ~/dev/projects/AlgoNoteHelper
git pull
docker compose up --build -d
```

注意：

- 服务器 `.env` 只在主机上，不进 git；生产 URL 必须是 HTTPS 域名，不是 localhost
- `pgdata` 命名卷会跨 `up --build` 保留；**不要**随意 `down -v`
- Schema / Better Auth 迁移**不会**随 compose 自动跑；需要时再手动 Alembic / `pnpm dlx auth@latest migrate`
- `.env.example` 继续用占位符；真实 IP 主要写在本文件与运维约定里，勿散落到示例配置

---

## 7. 测试账号（线上烟雾 / 截图）

用于 live UI、截图、非破坏性检查。**不要**把账号写进 README 正文；本文件与 [`.cursor/rules/test-credentials.mdc`](.cursor/rules/test-credentials.mdc) 可保留。

| 项 | 值 |
|---|---|
| App | https://algonote.keyneswu.com |
| Email | `test@example.com` |
| Password | `test123` |
| Role | `user`（非 admin） |

- 管理员另有账号（如 `keyneswu2@gmail.com`）——不要猜测或擅自改密
- 公开注册关闭；不要在 `/login` 尝试注册新用户

---

## 8. 本机密钥与网络代理

测试/调用第三方 API 时，密钥统一查（勿让用户重复粘贴、勿凭空猜）：

`/Users/wuyuetian/Documents/Developer/data/api-keys.md`

用户本机常开 Clash Verge。遇超时、装包失败等，可在**当前 shell** 临时设代理后重试（不要默认改全局 git/npm）：

```bash
export https_proxy=http://127.0.0.1:7897
export http_proxy=http://127.0.0.1:7897
export ALL_PROXY=http://127.0.0.1:7897
```

云端 Agent 环境通常没有该文件/代理；缺失时说明情况，不要伪造密钥。

---

## 9. OpenSpec（简短）

结构化功能变更时，优先走 OpenSpec skills（见 `.cursor/skills/`）：

1. **explore** — 对齐想法  
2. **propose** — 生成 change 产物  
3. **apply** — 按 tasks 实现  
4. **archive** — 完成后归档，并把 delta sync 进 `openspec/specs/`

- 活跃变更：`openspec/changes/<name>/`
- 已归档：`openspec/changes/archive/`
- 能力真相源：`openspec/specs/`
- 用户只要小修/问答时，不必强行开 change

---

## 10. 与 Cursor rules 的关系

| 资源 | 用途 |
|---|---|
| **本文件 `AGENTS.md`** | 跨工具总览：产品、约束、部署、账号、包管理 |
| [`.cursor/rules/project-status.mdc`](.cursor/rules/project-status.mdc) | 产品近况、部署实践、CI 态度（始终应用） |
| [`.cursor/rules/test-credentials.mdc`](.cursor/rules/test-credentials.mdc) | 测试账号细则（始终应用） |
| `.cursor/skills/openspec-*` | OpenSpec 工作流步骤 |
| `README.md` | 人类可读的快速开始与截图 |

冲突时：以更新的 rules / specs / 用户当轮指示为准；改完约定后应同步更新本文件相关小节。

---

## 11. 学习 / 概念类问题

当任务是**学习、概念、API 用法、框架配置、作业辅导**（而非纯改 bug / 跑命令）时：

1. **先查官方文档**，再回答；禁止凭记忆编造 API、参数或行为  
2. 优先文档工具（如 Context7 MCP）或官方站点（`WebFetch` / 搜索）  
3. 回答中**标明来源**（链接或章节）  
4. 查不到或版本不确定就说「不确定」，继续查或请用户补充  
5. 示例须与查到的官方用法一致；过时写法注明版本差异  

工程任务（写代码、修错、部署）按本文件与仓库惯例执行；遇到陌生 API 同样先查文档。

---

## 12. Agent 行为清单

**要做**

- 新功能：用户要结构化变更时走 OpenSpec  
- 部署：默认手动 SSH（Tailscale 优先）  
- 截图 / 线上冒烟：用上面的 test 账号  
- 前端：`pnpm`；Python：`uv`  
- UI：延续 HeroUI；落地页保持 brand-first、无公开 Sign up  

**不要做**

- 全站换成 shadcn / 删除 HeroUI「重做一遍」  
- 破坏生产卷或未确认的 `down -v`  
- 在 README 或公开文案里贴测试密码 / 服务器 IP（本文件与 private rules 除外）  
- 未要求就改 CI、防火墙、管理员密码  
- 把用户本机绝对路径或代理写进业务代码  

---

## 13. 快速验证

- 未登录打开 `/` → 落地页；登录后 `/` → `/notes`  
- Notes / Ask 仍为 HeroUI 交互与样式  
- `cd frontend && pnpm exec tsc --noEmit && pnpm test`  
- API：`/health` 正常  

有疑问时先读 `openspec/specs/` 对应能力与 `.cursor/rules/project-status.mdc`，再动手改代码。
