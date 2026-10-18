---
title: "OpenSearch keyword-sort investigation"
date: "2026-09-27"
description: "Benchmarked five OpenSearch releases and linked slower keyword sorting to a Lucene optimization threshold. In synthetic tests, lowering max_clause_count from 1024 to 128 made sorts roughly 2–3× faster on 2.12.0, 2.19.0, and 3.8.0, with little change on older controls. Upstream investigation remains open."
weight: 0
status: "selected"
link: "https://github.com/camerondurham/bug-repro-opensearch-keyword-sort"
links:
  - label: "OpenSearch #23162"
    url: "https://github.com/opensearch-project/OpenSearch/issues/23162"
  - label: "Saved results"
    url: "https://github.com/camerondurham/bug-repro-opensearch-keyword-sort/blob/main/results/summary.md"
  - label: "Related Lucene optimization (2023)"
    url: "https://github.com/apache/lucene/pull/11903"
---
