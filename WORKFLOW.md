# 🔄 工作流程规范

## Git推送规则

**重要**: 所有代码修改后必须立即推送到GitHub

---

## 📋 标准流程

### 1. 修改代码
```bash
# 修改文件
vim src/xxx.ts
```

### 2. 提交更改
```bash
git add .
git commit -m "描述修改内容"
```

### 3. 立即推送
```bash
git push origin main
```

---

## ✅ 适用场景

- ✅ Bug修复
- ✅ 功能开发
- ✅ 文档更新
- ✅ 配置修改
- ✅ 依赖更新
- ✅ 任何代码变更

---

## 🎯 执行原则

**每次修改 = 提交 + 推送**

不需要询问用户是否推送，修改完成后自动执行：

```bash
git add .
git commit -m "..."
git push origin main
```

---

## 📝 提交信息规范

### 格式
```
<emoji> <type>: <subject>

<body>
```

### Type
- ✨ feat: 新功能
- 🐛 fix: Bug修复
- 📝 docs: 文档更新
- 💄 style: 代码格式
- ♻️ refactor: 重构
- ⚡ perf: 性能优化
- ✅ test: 测试
- 🔧 chore: 构建/工具

### 示例
```
✨ feat: 添加智能记忆系统
🐛 fix: 修正包名格式错误
📝 docs: 更新README
```

---

## ⚠️ 注意事项

1. **推送前检查**
   - 确保代码可运行
   - 检查语法错误
   - 测试关键功能

2. **推送失败处理**
   - 网络问题：重试3次
   - 冲突问题：先pull再push
   - 权限问题：检查token

3. **大改动**
   - 分步骤提交
   - 每步都推送
   - 保持提交原子性

---

## 🔍 验证推送

推送后自动检查：
```bash
curl -s https://api.github.com/repos/ModeYapu/ai-life-assistant/commits | head -5
```

---

**记住**: 修改即推送，无需询问！✅
