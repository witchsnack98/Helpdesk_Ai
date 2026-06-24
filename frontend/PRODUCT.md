# Product

## Register

product

## Users

Two distinct surfaces for two user types:

- **Support Agents** — internal team members working in a task-dense dashboard. They triage incoming tickets, respond to customers via chat, and act on AI-generated suggestions. Their context is focused, high-frequency, and repetitive; the interface must not slow them down.
- **Customers** — end users submitting help requests and checking ticket status via a self-service portal. Their context is occasional, task-triggered (something went wrong); the interface must reduce friction and communicate status clearly.

**Admin** manages the knowledge base that feeds the AI triage system.

## Product Purpose

An AI-assisted helpdesk platform. Customers submit support tickets via a chat-based portal; the AI triages each ticket, suggests replies to agents, and routes priority correctly. Agents work a queue with AI acceleration. Admins manage the RAG knowledge base that grounds the AI.

The AI layer is not cosmetic — it is the product's primary differentiator. The interface should make the AI's presence feel competent and trustworthy, not gimmicky.

## Brand Personality

Professional, intelligent, dependable.

The feel is closer to Stripe Dashboard than to a consumer SaaS: data-dense but not cluttered, dark and focused, confident without being decorative. The AI elements (suggested replies, triage scores, sentiment meters) should feel like a trusted analyst sitting alongside the agent — not a chatbot or a flashy demo.

## Anti-references

- **Old-school Zendesk** — heavy forms, cluttered sidebar, dated blue-gray palette. Feels like enterprise legacy, not a modern tool.
- **AI gimmick UIs** — sci-fi particle effects, glowing orbs, animated circuit boards. The AI is a feature, not the theme.

## Design Principles

1. **The tool disappears into the task.** Agents should be thinking about the customer, not the interface. Navigation is immediate; information is where they expect it.
2. **Trust is earned by precision.** Every AI output (suggested reply, priority score, sentiment) carries a confidence signal. Show certainty levels; never hallucinate UI.
3. **State is never ambiguous.** Every ticket, message, and action has a clear status. Loading, empty, error, and success are always handled — never left blank.
4. **Density in service of flow.** The agent dashboard can be information-dense because experienced users benefit from it. Customer portal surfaces only what the customer needs right now.
5. **AI acceleration, human authority.** The AI suggests; the agent decides. UI patterns must never make AI actions feel automatic or irreversible without confirmation.

## Accessibility & Inclusion

Practical usability over compliance targets. Ensure sufficient contrast for the dark theme (text must be readable under office and low-light environments), keyboard-navigable ticket queue and chat, and reduced-motion safe animations. No formal WCAG level mandated; prioritize functional usability.
