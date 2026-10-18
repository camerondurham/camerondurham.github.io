---
title: "Preserving shard routing during OpenSearch migrations"
description: "Investigated a migration failure where a missing number_of_routing_shards setting concentrated writes on fewer shards, and reported it with a reproducible case. Maintainers resolved the report in March 2026 with a fix that preserves that setting and adds regression tests."
weight: 0
status: "selected"
link: "https://github.com/opensearch-project/opensearch-migrations/issues/1465"
links:
  - label: "Merged upstream fix"
    url: "https://github.com/opensearch-project/opensearch-migrations/pull/2354"
  - label: "Related core reproduction"
    url: "https://github.com/camerondurham/bug-repro-opensearch-routing"
---
