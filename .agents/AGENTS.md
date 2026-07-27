# UtiloBox Project Rules

## ⚠️ CRITICAL: Design & Color Rules

**NEVER change the color palette or design style without explicit user permission.**

### UtiloBox Brand Colors (MANDATORY)
- **Primary**: Orange — `orange-500` (#f97316), `orange-400`, `orange-600`
- **Accent/Glow**: Amber — `amber-400`, `amber-500`
- **Background (Light)**: `#fafafa`
- **Background (Dark)**: `#0b0f17`
- **Card Light**: `white`
- **Card Dark**: `slate-900`
- **Border Light**: `gray-100` / `gray-200`
- **Border Dark**: `slate-800`

### FORBIDDEN Colors (without user permission)
- ❌ Blue (`blue-*`) — do NOT use as primary or accent
- ❌ Purple (`purple-*`, `violet-*`, `indigo-*`) — do NOT use
- ❌ Green as primary — only allowed for success states (e.g., download button)
- ❌ Red as primary — only allowed for error/danger states

### Design Style
- Rounded corners: `rounded-2xl`, `rounded-3xl` preferred
- Shadows: `shadow-orange-500/20` tones
- Font: system-ui / sans-serif stack (no external fonts without permission)
- Dark mode: class-based `.dark` via `document.documentElement.classList`

### Tone & Language
- UI text may be in Indonesian (Bahasa Indonesia) — this is intentional
- Keep button labels consistent with existing Indonesian labels
