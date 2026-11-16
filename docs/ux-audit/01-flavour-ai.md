# Flavour module 1: AI style (`dev/AI-style`)

Run after the [core kit](00-core-audit.md). Build identity: a Gemini-style chat assistant ("Ask Iris anything about charging…") with a mode switch between **AI mode** and **Bento mode** (`AppModeContext`), plus generative widgets (nearest DC chargers, route with charging, vehicle range, last receipt) and a session receipt modal.

## What is different from the other flavours

| Area | AI-specific element |
|---|---|
| Entry | Chat prompt bar, suggestion cards, mode switcher |
| Discovery | Ask in words, or use the map/bento screens |
| Results | Generative widgets inside the conversation (Station, Trip route, Vehicle range, Receipt) |
| Post-charge | `SessionReceiptModal` |

## Key audit questions

**Understanding**
1. "Is this a chatbot, a map app, or both? How would you describe it to a friend?"
2. "What can you ask Iris? Give three examples." (Probes discoverability of capability.)
3. "What does the AI/Bento switch do? When would you use each?"
4. "Which answers would you trust enough to act on (range, price, route)?"

**Behaviour tasks (add to T1–T12)**

| # | Task | Notes to record |
|---|---|---|
| A1 | By typing, find the nearest DC fast charger | Typed vs tapped suggestion, wording used |
| A2 | Ask the assistant to plan a trip with charging stops | Does the widget open the full Trip Planner? |
| A3 | Ask how far the car can go on the current charge | Is the answer believed? |
| A4 | Ask for the last receipt | Finds it in chat or leaves chat |
| A5 | Switch to Bento mode and repeat T3 | Preference, time delta |
| A6 | Start a charge without using chat | Can they bypass the AI entirely? |

**Scored statements (1–5)**
- AI1 Typing a request was faster than tapping around.
- AI2 I knew what the assistant could and could not do.
- AI3 I trusted the assistant's numbers (price, range, ETA).
- AI4 When it didn't understand me, I knew how to recover.
- AI5 I'd rather have the chat than a normal home screen for charging.
- AI6 The AI/Bento switch was easy to find and understand.

## Flavour-specific hypotheses

| # | Hypothesis | Risk |
|---|---|---|
| AI-H1 | Free text hides capabilities, so first-time users type vague requests and fail | High |
| AI-H2 | Users in a hurry at a charger prefer direct Scan over chat, so the chat entry adds steps | High |
| AI-H3 | Generative widgets look interactive but may not deep-link into the real screens | Medium |
| AI-H4 | Trust: the responses seem authoritative, but data is mock/simulated, which is risky for range or price | High |
| AI-H5 | Mode switch state is not remembered or explained | Medium |
| AI-H6 | Chat history and error/offline states are unclear | Medium |

## Flavour metrics

| Metric | How | Target |
|---|---|---|
| Chat-first adoption | % tasks started in chat vs map/scan | informational |
| Prompt success | answered usefully on first try | ≥ 75% |
| Recovery rate | users who rephrase and succeed | ≥ 60% |
| Mode preference | AI vs Bento, per task type | informational |
| Trust score | mean AI3 | ≥ 3.8 |

## Instrument additions

`chat_prompt_sent{source: typed|suggestion}` · `chat_response_widget{type}` · `widget_action_tapped{type}` · `mode_switched{from,to}` · `chat_fallback_shown`

## Verdict template

- Best for: ___ (e.g. planning, questions)
- Worst for: ___ (e.g. urgent start of charge)
- Keep / change / remove: ___
