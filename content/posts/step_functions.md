+++
title = "Learnings from Using Step Functions"
description = "Some learnings from using AWS Step Functions to run jobs"
date = "2023-08-26"
+++

I've used AWS Step Functions over the past year to help an intern implement a log querying workflow,
and more recently to handle large scale data transfer between OpenSearch clusters. My opinion on using
a type of serverless orchestration service and serverless in general has changed between these two
projects and also since reading the infamous
[Prime Video Microservice vs Monolith](https://www.primevideotech.com/video-streaming/scaling-up-the-prime-video-audio-video-monitoring-service-and-reducing-costs-by-90) blog post.

## Background

AWS Step Functions are X. They let you do Y, Z and you are charged per state transition at $A per transition.

### Log Querying Orchestration

#### Purpose

#### Design and Alternatives

#### Learnings

### Job Framework Orchestration

#### Purpose

#### Design and Alternatives

#### Learnings

