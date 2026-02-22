---
title: "Zero-Downtime Migration Across 60 OpenSearch Clusters"
order: 1
period: "Amazon, 2025"
summary: "Led a staged migration of 1PB+ search data while maintaining availability and improving latency."
scope: "56B seller listings, 8.7M partners, multi-region traffic; sustained approximately 5K read TPS and approximately 200K write TPS during a 2-day migration window."
outcomes:
  - "Completed migration with zero client downtime."
  - "Reduced p90 API latency by 15% through Graviton-based OpenSearch capacity optimization."
methods:
  - "Phased cutover with guardrails and rollback criteria."
  - "Capacity planning tied to read/write traffic envelopes."
  - "Real-time validation and operational runbooks."
visibility: "proprietary system"
proof:
  - label: "LinkedIn profile"
    url: "https://www.linkedin.com/in/cameron-durham/"
  - label: "Public OpenSearch contribution index"
    url: "https://github.com/camerondurham/open-source-contributions"
---

This writeup intentionally shares architecture and execution patterns, not internal implementation details.
