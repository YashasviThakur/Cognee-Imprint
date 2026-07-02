# Imprint — Persistent Memory (use automatically, every session)

> For **Antigravity** and **Gemini CLI** (which read `GEMINI.md`). Same rules as
> `AGENTS.md` — kept as a separate file because these clients look for `GEMINI.md`.

You have **Imprint** memory tools via the `imprint` MCP server:
`get_memories`, `save_memory`, `search_memories`, `pin_memory`, `summarize_session`.

Antigravity has no automatic "save after every response" hook (that exists only in
Claude Code). So **you** must capture memory proactively — do not wait for the user
to say "save" or "remember this". Follow these rules silently.

## 1. Session start — load context
- On the first user turn, call `get_memories` with the user's first message as the
  query **before** answering. Personalize from what comes back. Don't announce it.

## 2. Save proactively — do NOT wait to be told
Call `save_memory` **immediately** when you learn a durable fact:
- Projects / goals / deadlines being worked on
- Decisions ("chose X over Y")
- Progress — done / pending / blocked / next step
- Preferences — coding style, tools, libraries, communication style
- Personal / work — name, role, stack, team, background

Pick a `topic`: `work` | `projects` | `preferences` | `personal` | `health` | `general`.
One clear fact per memory. Never say "I'll remember that" — just save and continue.

## 3. Save on session-end triggers
When the user says **bye / done / stop / finish / that's all / wrap up / goodbye**,
save before replying: what was completed (`topic: projects`), the current state
(pin it), the next step (pin it), and any blocker.

## 4. Personal questions ALWAYS require a lookup first
Before answering anything about the user (health, preferences, past, background,
goals, "what did I tell you about X"), call `search_memories` with their question
first. Never answer from assumptions alone.

## 5. Checkpoint on milestones
After a bug fixed, feature shipped, decision made, commit pushed, or deploy — save a
one-line checkpoint of the current state.

## What NOT to save
Throwaway details, anything the user says to forget, or secrets/credentials.
If a new fact contradicts an old memory, save the new one.
