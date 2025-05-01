请为我们的项目创建一个全面且统一的前端设计规范文档。

**项目背景与目标:**

*   **项目类型:** [运营管理后台]
*   **目标用户:** [专业人士]
*   **品牌/产品个性:** [现代、简洁、专业、友好、有趣、高端、实用]
*   **核心设计原则:** [一致性、易用性、可访问性、高性能、响应式优先等，选择最重要的 3-5 个]

**规范内容要求（请详细阐述以下每个方面）：**

1.  **色彩规范 (Color Palette):**
    *   定义主色调 (Primary Colors)：用于品牌、关键操作。
    *   定义辅助色调 (Secondary Colors)：用于次要元素、补充主色。
    *   定义强调色/点缀色 (Accent Colors)：用于需要突出的元素、状态变化。
    *   定义中性色 (Neutral Colors)：用于背景、边框、文本（包括不同深浅的灰色）。
    *   定义状态色 (Status Colors)：成功 (Success)、错误 (Error)、警告 (Warning)、信息 (Info)。
    *   提供每种颜色的 HEX/RGBa 值，并说明其典型用途。

2.  **字体规范 (Typography):**
    *   指定主要字体 (Primary Font Family)：用于标题和正文（或分别为标题和正文指定）。
    *   指定备用字体 (Fallback Fonts)：确保跨平台兼容性。
    *   定义字号层级 (Font Sizes)：包括 H1 到 H6 标题、正文、小字号文本、按钮文本等的 `px` 或 `rem` 值。
    *   定义字重 (Font Weights)：例如 Light, Regular, Medium, Bold 等，并说明其使用场景。
    *   定义行高 (Line Height)：为不同字号的文本指定合适的行高，提升可读性。
    *   定义字间距 (Letter Spacing)：如果需要，为标题等元素指定微调。

3.  **布局与间距 (Layout & Spacing):**
    *   定义基础间距单位 (Base Spacing Unit)：例如 8px 或 10px，所有间距（margin, padding）应基于此单位的倍数。
    *   提供常用的间距值示例 (Spacing Scale)：例如 4px, 8px, 12px, 16px, 24px, 32px, 48px 等。
    *   定义栅格系统 (Grid System)：列数（例如 12 或 24）、列间距 (Gutter)、响应式断点 (Breakpoints) 及其对应的布局调整规则。
    *   定义最大内容宽度 (Max Content Width)。

4.  **核心 UI 组件规范 (Core UI Components):**
    *   为以下常见组件定义视觉样式、尺寸、间距和交互状态 (Default, Hover, Focus, Active, Disabled)：
        *   **按钮 (Buttons):** 主要按钮、次要按钮、文本按钮、图标按钮、不同尺寸。
        *   **表单元素 (Forms):** 输入框 (Input Fields)、文本域 (Textareas)、下拉选择 (Selects/Dropdowns)、单选框 (Radio Buttons)、复选框 (Checkboxes)、开关 (Toggles)。包括标签 (Labels)、提示文字 (Placeholders)、验证状态 (Validation States - Error, Success)。
        *   **卡片 (Cards):** 基本结构、阴影/边框、内边距。
        *   **模态框/对话框 (Modals/Dialogs):** 尺寸、背景遮罩、标题、内容区、操作按钮区域。
        *   **导航 (Navigation):** 顶部导航栏、侧边栏菜单、面包屑、标签页 (Tabs)。
        *   **列表 (Lists):** 定义列表项样式、分隔线。
        *   **提示/通知 (Alerts/Notifications):** 不同状态（Info, Success, Warning, Error）的样式。
        *   **(根据你的项目按需添加其他核心组件...)**

5.  **图标规范 (Iconography):**
    *   指定图标风格 (Icon Style)：例如 线条图标 (Line/Outline)、面性图标 (Solid/Filled)。
    *   指定图标库 (Icon Library)：[例如：推荐使用 Font Awesome, Material Icons, 或项目自定义 SVG 图标库]。
    *   定义常用图标尺寸 (Icon Sizes)。
    *   说明图标颜色使用规则（通常继承文本颜色或使用特定语义色）。

6.  **交互与动效 (Interaction & Animation):**
    *   设定基本原则：动效应有意义、流畅、避免过度分散注意力。
    *   定义标准过渡效果 (Standard Transitions)：例如 `transition: all 0.3s ease;` 用于状态变化。
    *   指定常用微交互 (Microinteractions) 的模式：例如按钮点击反馈、加载指示器样式、元素进入/退出动画（淡入淡出、滑动）。

7.  **可访问性 (Accessibility - A11y):**
    *   强调 WCAG 标准的重要性（例如 AA 级）。
    *   要求：足够的色彩对比度、清晰的焦点状态 (Focus States)、键盘导航支持、为图片提供 `alt` 文本、使用语义化 HTML 标签、必要时使用 ARIA 属性。

8.  **命名规范 (Naming Conventions):**
    *   推荐 CSS 命名方法：[例如：BEM (Block, Element, Modifier), SMACSS, 或其他约定]。提供示例。
    *   JavaScript 变量/函数命名约定（例如：camelCase）。

9.  **性能考虑 (Performance):**
    *   图片优化要求（格式选择、压缩）。
    *   代码优化建议（减少重绘重排、按需加载）。

**输出格式要求:**

*   请使用清晰的 Markdown 格式进行组织，包含标题、列表和代码块（用于展示颜色值、代码示例等）。
*   语言简洁、明确，易于理解和执行。

请基于以上要求，生成这份前端设计规范文档。