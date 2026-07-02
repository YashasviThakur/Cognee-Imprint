# Imprint — Persistent Memory (use automatically, every session)

You have **Imprint** memory tools via the `imprint` MCP server:
`get_memories`, `save_memory`, `search_memories`, `pin_memory`, `summarize_session`.

These IDEs have no automatic "save after every response" hook (that exists only in
Claude Code). So **you** are responsible for capturing memory proactively — do not
wait for the user to say "save" or "remember this". Follow these rules silently.

## 1. Session start — load context
- On the first user turn, call `get_memories` with the user's first message as the
  query **before** you answer. Use what comes back to personalize from message one.
- Never announce it (no "loading memories…"). Just use the results.

## 2. Save proactively — do NOT wait to be told
Call `save_memory` **immediately** whenever you learn a durable fact:
- **Projects / goals / deadlines** being worked on
- **Decisions** ("chose Groq over Bedrock", "using Postgres not Mongo")
- **Progress** — what's done, what's pending, what's blocked, the next step
- **Preferences** — coding style, tools, libraries, communication style
- **Personal / work** — name, role, stack, team, background

Pick a `topic`: `work` | `projects` | `preferences` | `personal` | `health` | `general`.
Write one clear fact per memory. Never say "I'll remember that" — just call the tool
and continue the conversation normally.

## 3. Save on session-end triggers
When the user says **bye / done / stop / finish / that's all / wrap up / goodbye**,
save session state before replying:
1. `save_memory` — what was completed this session (`topic: projects`)
2. `save_memory` — current state, exactly where it stands (`pin_memory` this one)
3. `save_memory` — the next step (pin this one too)
4. `save_memory` — any blocker (only if there is one)

## 4. Personal questions ALWAYS require a lookup first
Before answering **anything** about the user — their health, preferences, past,
background, goals, or "what did I tell you about X" — call `search_memories` with
their question first. Never answer personal questions from assumptions alone.

## 5. Checkpoint on milestones
After a meaningful step — a bug fixed, a feature shipped, a decision made, a commit
pushed, a deploy — save a one-line checkpoint of the current state.

## What NOT to save
- Throwaway details that won't matter next session
- Anything the user asks you to forget
- Secrets / credentials

If a new fact contradicts an old memory, save the new one (the old becomes stale).
