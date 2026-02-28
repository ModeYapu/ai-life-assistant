# 🎉 AI Life Assistant - 更新日志

## v0.2.0 (2026-02-28)

### ✨ 新功能

#### 1. 最新AI模型支持
- ✅ **OpenAI GPT-5.2** - 最新旗舰模型
- ✅ **GPT-5.2 Turbo** - 快速版本
- ✅ **O3 Mini** - 经济实惠选择
- ✅ **Claude 3.7 Sonnet/Opus** - Anthropic最新模型
- ✅ **Gemini 3.0 Pro/Ultra** - Google最新多模态模型
- ✅ **GLM-5 Plus** - 智谱AI最新模型（新增）
- ✅ **Qwen 2.5 72B** - 本地部署模型
- ✅ **DeepSeek V3** - 本地部署模型

#### 2. Code Plan功能（代码规划）
- ✅ 自动分解编程任务
- ✅ 生成实现步骤
- ✅ 估算开发时间
- ✅ 逐步执行代码生成
- ✅ 支持规划优化

#### 3. 智能模型选择
- ✅ 模型能力对比
- ✅ 性价比推荐
- ✅ Code Plan支持标识

---

### 🔄 更改

#### 移除商业化内容
- ❌ 移除订阅系统（Subscription）
- ❌ 移除付费功能限制
- ❌ 移除商业计划相关代码

#### 用户系统优化
- ✅ 简化用户数据结构
- ✅ 添加Code Plan开关
- ✅ 优化用户偏好设置

---

### 📦 新增文件

```
src/config/
└── aiModels.ts                    # AI模型配置

src/services/
├── codePlanService.ts             # 代码规划服务
└── aiService_zhipu.ts             # 智谱AI服务

src/screens/
└── CodePlanScreen.tsx             # 代码规划界面
```

---

### 🎯 支持的模型列表

| 模型 | Provider | Code Plan | 上下文窗口 | 价格(输入/输出) |
|------|----------|-----------|-----------|--------------|
| GPT-5.2 Turbo | OpenAI | ✅ | 128K | $0.01/$0.03 |
| GPT-5.2 | OpenAI | ✅ | 200K | $0.03/$0.06 |
| O3 Mini | OpenAI | ✅ | 200K | $0.001/$0.002 |
| Claude 3.7 Sonnet | Anthropic | ✅ | 200K | $0.003/$0.015 |
| Claude 3.7 Opus | Anthropic | ✅ | 200K | $0.015/$0.075 |
| Gemini 3.0 Pro | Google | ✅ | 1M | $0.00125/$0.005 |
| Gemini 3.0 Ultra | Google | ✅ | 1M | $0.0025/$0.01 |
| **GLM-5 Plus** | Zhipu | ✅ | 128K | $0.001/$0.001 |
| GLM-5 | Zhipu | ❌ | 128K | $0.0005/$0.0005 |
| Qwen 2.5 72B | Local | ❌ | 32K | Free |
| DeepSeek V3 | Local | ✅ | 64K | Free |

---

### 💡 Code Plan功能说明

**支持的模型**:
- GPT-5.2 Turbo / GPT-5.2
- O3 Mini
- Claude 3.7 Sonnet / Opus
- Gemini 3.0 Pro / Ultra
- GLM-5 Plus
- DeepSeek V3 (Local)

**使用步骤**:
1. 选择支持Code Plan的模型
2. 输入任务描述
3. 生成实现规划
4. 逐步执行代码生成

**示例**:
```
任务: "实现一个用户登录系统"

规划:
步骤1: 设计数据库schema (5分钟)
步骤2: 实现用户注册API (10分钟)
步骤3: 实现登录验证逻辑 (10分钟)
步骤4: 添加JWT token生成 (5分钟)
步骤5: 编写测试用例 (10分钟)

总计: 5个步骤，约40分钟
```

---

### 🔧 技术改进

#### AI服务增强
- ✅ 添加智谱AI支持
- ✅ 添加本地模型支持
- ✅ 优化错误处理
- ✅ 改进API调用逻辑

#### 配置管理
- ✅ 集中化模型配置
- ✅ 动态模型加载
- ✅ 能力标识系统

---

### 📊 性能对比

| 模型 | 速度 | 质量 | 成本 | Code Plan | 推荐场景 |
|------|------|------|------|-----------|---------|
| GPT-5.2 Turbo | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ✅ | 通用 |
| O3 Mini | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ | 经济 |
| Claude 3.7 Sonnet | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ | **推荐** |
| Gemini 3.0 Pro | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ | 大上下文 |
| GLM-5 Plus | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ | 中文 |

---

### 🚀 快速开始

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 安装依赖（如有新增）
npm install

# 3. 运行项目
npm start  # 终端1
npm run android  # 终端2

# 4. 配置API Keys
# 进入设置页面，配置所需的API Keys
```

---

### ⚙️ API Keys配置

**必需的Keys**:
- OpenAI API Key (用于GPT系列)
- Anthropic API Key (用于Claude系列)
- Google API Key (用于Gemini系列)
- **Zhipu AI API Key** (用于GLM系列，新增)

**可选**:
- Local Model Endpoint (本地模型端点)

---

### 📚 相关文档

- [AI模型配置](./src/config/aiModels.ts)
- [Code Plan服务](./src/services/codePlanService.ts)
- [模型选择指南](./docs/AI_MODEL_SELECTION.md)

---

### 🐛 已知问题

- [ ] 本地模型连接需要手动配置端点
- [ ] Code Plan功能需要较新版本的模型
- [ ] 部分模型API可能有地区限制

---

### 🔜 下一版本计划

- [ ] 添加更多本地模型支持
- [ ] 优化Code Plan性能
- [ ] 添加代码执行沙箱
- [ ] 支持更多编程语言

---

**版本**: v0.2.0  
**发布日期**: 2026-02-28  
**主要更新**: 最新模型 + Code Plan + 移除商业化  
