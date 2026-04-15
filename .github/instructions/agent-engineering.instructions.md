---
description: "Use when designing or implementing AI agents, tools, retrieval pipelines, reliability patterns, security controls, evaluation systems, or agent UX. Enforces the 7 agent engineering disciplines: system design, tool contracts, retrieval, reliability, security, observability, and product thinking."
applyTo: "ai_engine/**/*.py"
---

# Agent Engineering Principles

Agents take real actions in the real world. Writing good prompts is the bare minimum. These seven disciplines separate agents that survive in production from agents that only impress in demos.

## 1. System Design

- Treat agents as distributed systems: define explicit data flow across LLM, tools, memory, and sub-agents
- Every component must have a defined failure mode; design fallback behavior before it is needed
- Avoid spaghetti orchestration — use clean architecture layers; domain decisions must not leak into infrastructure concerns
- When multiple agents or sub-agents coordinate on a task, define clear handoff contracts between them

## 2. Tool and Contract Design

- Every tool schema must declare strict types, mark required fields, and include at least one concrete example
- Vague schemas (e.g., `user_id: str`) cause LLMs to hallucinate inputs — be explicit: add regex patterns, enums, or examples
- Read every tool contract aloud: if a new engineer cannot understand input and output from the schema alone, tighten it
- Tool descriptions must describe *what the tool does*, not *how it is implemented*

## 3. Retrieval Engineering (RAG)

- Chunk size must be tuned per document type: too large dilutes detail, too small loses context
- Validate that semantically similar concepts cluster together in embedding space before shipping
- Always add a re-ranking pass after initial retrieval to score results by actual relevance, not just vector proximity
- Treat context quality as a first-class concern: irrelevant documents produce confident wrong answers — the model cannot tell the context is garbage

## 4. Reliability Engineering

- All external API calls must have: retry with exponential backoff, timeout, and an explicit fallback path
- Implement circuit breakers to prevent a single failing downstream service from cascading into full agent failure
- Agents must never hang indefinitely — every blocking operation needs a timeout
- Plan B must exist before Plan A ships

## 5. Security and Safety

- Validate and sanitize all user input before it enters the system prompt or tool parameters — treat user content as untrusted
- Apply least-privilege: grant agents only the permissions required for their task; no unnecessary write, delete, or send access
- Irreversible actions (send email, charge payment, delete record) must require explicit human approval or have a dry-run mode
- Defend against prompt injection: structure prompts so user-supplied content cannot override system instructions
- Output filters must block policy-violating or out-of-scope responses before they reach the user

## 6. Evaluation and Observability

- Trace every agent decision: log tool name, input parameters, output, latency, and model reasoning at each step
- Build evaluation pipelines with known-good test cases *before* shipping new agent capabilities
- Track quantitative metrics per task: success rate, latency (p50/p95), and cost — "it seems better" is not a deployment criterion
- Automated regression tests must catch capability degradation before it reaches production; vibes do not scale

## 7. Product Thinking

- The agent must communicate its confidence level and known limitations clearly to the user
- Define escalation paths explicitly: specify conditions under which the agent should ask for clarification versus hand off to a human
- Error messages must be human-readable and actionable, not raw stack traces or model error codes
- Design for inherent unpredictability: the same input may produce different outputs on different runs; set user expectations accordingly
- Build trust incrementally: start agents with low-stakes, reversible tasks and expand permissions only as reliability is demonstrated
