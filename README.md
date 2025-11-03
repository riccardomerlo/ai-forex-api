TODO:

- fix new library updates breaking changes
- fix typing all over the app (avoid any at any cost hihi LOL)
- strip down all useless code and redundancies
- remove mock data and actually use real data
- [] redis for performance?

```
ai-forex-api
├─ .eslintrc.js
├─ .nvmrc
├─ .prettierrc
├─ README.md
├─ bun.lock
├─ jest.config.js
├─ nodemon.json
├─ package.json
├─ src
│  ├─ agents
│  │  ├─ AdvancedOrchestrator.ts
│  │  └─ WorkingMemory.ts
│  ├─ app.ts
│  ├─ config
│  │  └─ index.ts
│  ├─ controllers
│  │  ├─ health.controller.ts
│  │  └─ prediction.controller.ts
│  ├─ middleware
│  │  ├─ error.middleware.ts
│  │  └─ logger.middleware.ts
│  ├─ routes
│  │  └─ index.ts
│  ├─ tools
│  │  └─ index.ts
│  ├─ types
│  │  └─ index.ts
│  └─ utils
│     └─ logger.ts
├─ swagger.yaml
├─ tests
│  └─ health.test.ts
└─ tsconfig.json

```