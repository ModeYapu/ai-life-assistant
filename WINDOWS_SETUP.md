# 🪟 Windows环境运行指南

## 问题：Cannot start server in new window

### 原因
React Native在Windows上无法自动打开新终端窗口运行Metro bundler。

---

## ✅ 解决方案

### 方法1：分步启动（推荐）

**终端1 - 启动Metro服务器**
```bash
npm start
```

**终端2 - 运行Android**
```bash
npm run android
```

---

### 方法2：修改package.json脚本

```json
{
  "scripts": {
    "android": "react-native run-android",
    "start": "react-native start",
    "android:debug": "react-native run-android --variant=debug",
    "android:release": "react-native run-android --variant=release"
  }
}
```

---

### 方法3：使用react-native.config.js

创建文件 `react-native.config.js`:
```javascript
module.exports = {
  project: {
    android: {
      unstable_reactLegacyComponentNames: ['RCTWebView'],
    },
  },
};
```

---

## 🚀 完整启动流程

### 1. 检查环境
```bash
# 检查Android SDK
adb version

# 检查Java
java -version

# 检查环境变量
echo %ANDROID_HOME%
```

### 2. 启动模拟器或连接真机
```bash
# 列出设备
adb devices

# 启动模拟器（如果有）
emulator -avd <avd_name>
```

### 3. 启动项目（两步法）

**终端1：**
```bash
cd D:\U_I_U\OOO\ai-life-assistant
npm start
```

等待看到：
```
Metro waiting on http://localhost:8081
```

**终端2（新开一个PowerShell）：**
```bash
cd D:\U_I_U\OOO\ai-life-assistant
npm run android
```

---

## 🔧 环境配置

### Windows环境变量

**用户变量：**
```
ANDROID_HOME=C:\Users\你的用户名\AppData\Local\Android\Sdk
```

**Path添加：**
```
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\tools
%ANDROID_HOME%\tools\bin
%ANDROID_HOME%\emulator
```

---

## ⚠️ 常见问题

### 1. SDK位置错误
**错误：**
```
SDK location not found
```

**解决：**
创建 `local.properties` 文件：
```
sdk.dir=C\:\\Users\\你的用户名\\AppData\\Local\\Android\\Sdk
```

### 2. Gradle构建失败
**解决：**
```bash
cd android
./gradlew clean
cd ..
npm run android
```

### 3. 端口占用
**错误：**
```
Port 8081 already in use
```

**解决：**
```bash
# 查找占用进程
netstat -ano | findstr :8081

# 结束进程
taskkill /F /PID <PID>
```

---

## 📱 真机调试

### 1. 开启开发者选项
- 设置 → 关于手机 → 连续点击版本号7次
- 返回 → 系统 → 开发者选项
- 开启USB调试

### 2. 连接电脑
```bash
# 检查连接
adb devices

# 应该看到
List of devices attached
<device_id>    device
```

### 3. 运行
```bash
npm start  # 终端1
npm run android  # 终端2
```

---

## 🎯 快速启动脚本

创建 `start-android.bat`:
```batch
@echo off
start cmd /k "npm start"
timeout /t 5
npm run android
```

双击运行即可。

---

## ✅ 验证成功

成功运行后会看到：
```
BUILD SUCCESSFUL in 30s
Installing APK...
Starting: Intent { act=android.intent.action.MAIN... }
```

手机上会自动安装并打开应用。

---

## 📚 参考资料

- [React Native Windows环境配置](https://reactnative.dev/docs/environment-setup)
- [Android开发环境配置](https://developer.android.com/studio)
