# SPYRAL OS — Closed Alpha Playbook

**Status:** Active  
**Version:** 1.0  
**Date:** 2026-07-20  
**Owner:** Implementation Engineer  
**Authority:** Product Advisor — Milestone B: Closed Alpha

---

## Purpose

We are not launching. We are learning.

The goal of Closed Alpha is to observe **15 first-time users** interacting with SPYRAL OS with zero guidance. Every session will be recorded (with permission), observed, and debriefed to uncover:

- Where users hesitate or abandon the journey
- When users begin trusting the system
- What confuses or delights them
- Whether the core promise — *"Tell SPYRAL where you want to go"* — is instinctively understood

**Learn, not launch.** No Product Hunt. No LinkedIn. No press. No marketing.

---

## Participant Profile

### Target: 15 Participants

| Role | Count | Profile |
|------|-------|---------|
| Founders / CEOs | 5 | Building something; responsible for strategy and direction |
| Operators (COO, PM, Business Manager) | 5 | Execute strategy; manage teams and operations |
| Consultants / Advisors | 5 | Help others navigate decisions; strategic advisors |

### Inclusion Criteria
- Has never seen or used SPYRAL before
- Has at least one significant goal or decision they want to make in the next 12 months
- Willing to share screen and be recorded (confidentially)
- Can commit to a 30-minute session + 10-minute debrief

### Exclusion Criteria
- Anyone who has been briefed on SPYRAL's architecture or philosophy
- Engineers or product builders currently working on a competing product
- Friends or family (to avoid bias)

---

## Canonical Scenario

### The Prompt (Read Exactly)

> *"Tell SPYRAL something important you're trying to achieve in the next 12 months."*

### Rules for the Facilitator
- **Do NOT** explain what SPYRAL is.
- **Do NOT** give examples of what to type.
- **Do NOT** offer guidance on how to use the interface.
- **Do NOT** answer questions about how the system works.
- **DO** say: *"Just try whatever feels natural."*
- **DO** stay silent while they interact.

### Session Flow

1. **Setup (2 min):** Open SPYRAL on a clean browser. Share screen. Start recording.
2. **Prompt (1 min):** Read the canonical prompt aloud. Then go silent.
3. **Free Interaction (20 min):** User explores SPYRAL independently. Facilitator does not intervene.
4. **Natural End (5 min):** When the user indicates they are done, proceed to the interview.
5. **Debrief Interview (10 min):** Ask the four questions only.

---

## Facilitator Script

### Opening

> *"Thank you for participating. We're testing an early version of a tool we're building. There's no right or wrong way to use it. I'm going to give you one sentence of instruction, then I'll stay quiet and watch. After you're done, I'll ask a few questions."*

### The Instruction

> *"Tell SPYRAL something important you're trying to achieve in the next 12 months."*

### During the Session

| If the user says… | The facilitator says… |
|-------------------|----------------------|
| *"What is this?"* | *"Whatever it seems like. Just try it."* |
| *"What should I type?"* | *"Whatever comes to mind. There's no wrong answer."* |
| *"Is this right?"* | *"If it feels right to you, it's right."* |
| *"What does this button do?"* | *"Why not press it and see?"* |
| *"I'm stuck."* | *"Take your time. No pressure."* |
| *"Am I done?"* | *"Are you satisfied with what you've learned?"* |
| Any question about the product | *"I'd love to answer that after the session. For now, just explore."* |

### Closing

> *"Thank you. Let me ask you four quick questions."*

---

## Observation Template

For every session, record observations in these four categories.

### Confusion Points
*Where did the user hesitate or look lost?*

| Timestamp | What happened | Severity (1-5) |
|-----------|---------------|----------------|
| | | |
| | | |

### Trust Points
*When did the user begin relying on SPYRAL?*

| Timestamp | What happened | Notes |
|-----------|---------------|-------|
| | | |

### Delight Points
*When did the user smile, laugh, or express positive surprise?*

| Timestamp | What happened | User quote |
|-----------|---------------|------------|
| | | |

### Abandonment Points
*Where did the user stop or give up?*

| Timestamp | What happened | Did they return? |
|-----------|---------------|------------------|
| | | |

---

## Success Metrics

### Session Metrics

| Metric | Target | Result |
|--------|--------|--------|
| Time to First Intent | < 30 sec | |
| Time to First Insight | < 5 min | |
| Journey Completion | > 70% | |
| Resume Rate | > 50% | |
| Recommendation Acceptance | > 60% | |
| "I'd use this again" | > 8/10 | |

### Cumulative Metrics

Track after every 5 sessions:

- Average Time to First Intent
- Average Time to First Insight
- Journey Completion Rate
- Top 3 Confusion Points (across sessions)
- Top 3 Delight Points (across sessions)
- Net Promoter Sentiment (qualitative)

---

## Decision Rules

### How Observations Become Backlog Items

```
Observation → Pattern (appears in 2+ sessions) → Insight → Decision → Implementation → Validation
```

| Rule | Action |
|------|--------|
| A confusion point appears in 1 session | Log it. Monitor next sessions. |
| A confusion point appears in 2+ sessions | Elevate to **backlog item** with priority 3 |
| A confusion point blocks journey completion | Elevate to **priority 1** — fix before next session |
| A delight point appears in 1 session | Log it. Consider reinforcing. |
| A delight point appears in 2+ sessions | Elevate to **product strength** — protect it |
| An abandonment point causes session end | Elevate to **critical** — investigate immediately |
| A trust point appears early (< 2 min) | Log as **positive signal** — validate across more users |

### Prioritisation Matrix

| Impact | Frequency | Priority |
|--------|-----------|----------|
| High | High | P1 — Fix before next session block |
| High | Low | P2 — Fix within current iteration |
| Low | High | P3 — Fix when convenient |
| Low | Low | P4 — Backlog / watchlist |

---

## Post-Session Debrief

### Team Discussion Format

After each session (or batch of up to 3 sessions), hold a 15-minute debrief.

**Agenda:**

1. **One-minute summary** — Each observer shares their biggest takeaway (60 sec each)
2. **Observations cluster** — Group observations into Confusion / Trust / Delight / Abandonment
3. **Pattern check** — Does any observation match a previous session? If yes, it becomes a pattern.
4. **Priority vote** — Each team member votes on the top 3 items to address
5. **Decision** — Assign backlog items with priority and owner
6. **Action items** — What changes before the next session?

### Debrief Record

| Session # | Date | Key Observations | Patterns Found | Decisions Made | Action Items |
|-----------|------|------------------|----------------|----------------|--------------|
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |
| 4 | | | | | |
| 5 | | | | | |

### After Every 5 Sessions

Stop coding. Conduct a full review:

1. Review all session recordings (or notes)
2. Cluster all observations into themes
3. Identify top 5 patterns
4. Prioritise the next iteration
5. Then and only then — implement

---

## Checklist Before First Session

- [ ] SPYRAL OS v0.2.1-alpha deployed and accessible
- [ ] Recording tool ready (permission obtained)
- [ ] Observation template printed or accessible
- [ ] Debrief format agreed with team
- [ ] Participant consent form prepared
- [ ] Canonical prompt memorised (no reading)
- [ ] Facilitator assigned and briefed
- [ ] Session scheduled (30 min + 10 min debrief)
- [ ] Backup plan if technical issues arise

---

*"After every five interviews — stop coding. Review recordings. Cluster observations. Then prioritize."* — Product Advisor
