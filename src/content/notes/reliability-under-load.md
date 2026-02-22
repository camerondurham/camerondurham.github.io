---
title: "Reliability Under Load: What Actually Worked"
date: "2025-11-15"
summary: "Operational patterns I now default to for high-throughput systems where indexing latency and availability both matter."
tags: ["distributed-systems", "reliability", "operations"]
---

This note intentionally avoids internal implementation details and focuses on transferable engineering lessons.

## 1. Separate customer-critical and bulk workloads early

If latency-sensitive updates and backfills share the same path, p99 latency eventually drifts in ways that are hard to explain to users. Explicit prioritization and queue policy boundaries are worth the complexity.

## 2. Define rollback criteria before migration day

Migration plans fail when rollback conditions are ambiguous. A concrete threshold matrix for throughput, error rates, and latency avoids long debates during incident pressure.

## 3. Measure what users observe, not just system throughput

Throughput can look healthy while user-visible freshness degrades. I now track customer-visible delay as a first-class metric alongside ingestion volume.

## 4. Treat storage throughput as a first-class scaling dimension

CPU and memory graphs can be green while storage limits are saturated. Include storage throughput and burst characteristics in scaling policies and incident triage.
