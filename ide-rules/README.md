# Imprint — cross-IDE auto-save rules

**Why this exists.** Imprint captures memory two ways:

1. **The `save_memory` MCP tool** — works in every IDE, but the host model only calls
   it when it decides to (or when you ask). Model-dependent.
2. **A Stop hook** (`mcp/extract-and-save.js`) — extracts durable facts after *every*
   response, guaranteed, even if the model forgets. **This only works in Claude Code /
   Claude Desktop**, which support post-response hooks. Cursor, Codex, and Antigravity
   don't expose an equivalent hook.

So in every IDE **except Claude Code**, memory only saves when the model chooses to —
which is why you end up saying "save this" explicitly.

These rules files close most of that gap: they instruct the model to **load context at
session start and save durable facts proactively**, without being asked. It's not as
bulletproof as the Stop hook (still model-dependent), but in practice it makes the
other IDEs save on their own most of the time.

> Prerequisite: the `imprint` MCP server must already be configured in your IDE. Get
> the ready-made config from the dashboard → **Connect your IDE**.

## Install per IDE

| IDE | File | Where it goes |
|-----|------|---------------|
| **Cursor** | `cursor-imprint.mdc` | Copy to `.cursor/rules/imprint.mdc` in your project, **or** paste its body into Cursor → Settings → Rules → *User Rules*. (`alwaysApply: true` keeps it on.) |
| **Codex** | `AGENTS.md` | Copy to your project root as `AGENTS.md` (merge into an existing one if present). Codex reads it automatically. |
| **Antigravity** | `GEMINI.md` (or `AGENTS.md`) | Copy to your project root, **or** paste the body into Antigravity's Rules / custom-instructions panel. |
| **Gemini CLI** | `GEMINI.md` | Copy to your project root (or `~/.gemini/GEMINI.md` for global). |
| **Claude Code** | — | Not needed here — use the Stop hook + `CLAUDE.md` from the dashboard's Connect flow (guaranteed capture). |

**Global vs per-project:** drop the file in a project to scope it there, or use the
IDE's global rules location (e.g. Cursor User Rules, `~/.gemini/GEMINI.md`) to apply it
everywhere. All three files carry the same instructions in each client's expected format.

## What the rules tell the model to do
- **Session start:** call `get_memories` with your first message, before replying.
- **Proactively `save_memory`** for durable facts (projects, decisions, progress,
  preferences, personal/work) — without being asked.
- **On "bye/done/wrap up":** save completed work, current state (pinned), and next step.
- **Personal questions:** `search_memories` first, never answer from assumptions.
- **Milestones:** checkpoint the current state after a fix / ship / deploy.
