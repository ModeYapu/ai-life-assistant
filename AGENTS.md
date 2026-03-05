# Repository Guidelines

## Project Structure & Module Organization
This repository is a React Native + TypeScript app.

- `App.tsx`, `index.js`: app entry points.
- `src/navigation/`: navigation setup (`AppNavigator.tsx`).
- `src/screens/`: feature screens (for example `HomeScreen.tsx`, `TasksScreen.tsx`).
- `src/store/`: Redux Toolkit store and slices (`src/store/slices/*.ts`).
- `src/services/`: AI, storage, and memory-related services.
- `src/constants/`, `src/config/`, `src/types/`, `src/utils/`, `src/hooks/`: shared configuration, types, utilities, and hooks.
- `android/`, `ios/`: native platform projects.
- `docs/`: product and technical documentation.

Use path aliases instead of long relative imports: `@/`, `@services/*`, `@store/*`, etc. (configured in `tsconfig.json` and `babel.config.js`).

## Build, Test, and Development Commands
- `npm install`: install dependencies (Node `>=18`).
- `npm run start`: start Metro bundler.
- `npm run android`: build and run Android app.
- `npm run ios`: build and run iOS app (macOS/Xcode required).
- `npm run lint`: run ESLint across the repo.
- `npm run type-check`: run TypeScript checks without emit.
- `npm test`: run Jest tests.
- `npm run android:clean`: clean Android Gradle outputs.

## Coding Style & Naming Conventions
- Language: TypeScript/TSX with strict typing (`"strict": true`).
- Indentation: 2 spaces; keep semicolons.
- Components/screens: `PascalCase` (for example `TaskDetailScreen.tsx`).
- Variables/functions: `camelCase`; constants may use `UPPER_SNAKE_CASE`.
- Redux slices: `<domain>Slice.ts` and colocate in `src/store/slices/`.
- Keep modules focused; move reusable logic into `src/services/` or `src/utils/`.

## Testing Guidelines
Jest is configured via the `npm test` script. Add tests for new logic, especially reducers, selectors, and service utilities.

- Name tests `*.test.ts` / `*.test.tsx`.
- Prefer colocated tests near source files or in `__tests__/`.
- Run `npm test`, `npm run lint`, and `npm run type-check` before opening a PR.

## Commit & Pull Request Guidelines
Current history uses Conventional Commit-style prefixes with optional emoji, e.g.:
- `✨ feat: 添加日期选择组件`
- `🔧 fix: 修复首页导航按钮无响应问题`
- `📚 docs: 创建AI Agent完全构建指南`

PRs should include:
- clear summary of user-facing and technical changes,
- linked issue/task (if available),
- screenshots or recordings for UI changes,
- verification notes listing commands run and results.
