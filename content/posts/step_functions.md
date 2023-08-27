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

My team distributes our applications across ~40+ AWS accounts, one for each
service and region per AWS guidance. Whenever we want to trace some event
between applications, we primarily just use logs.

We wanted a tool to look for specific log messages across many AWS accounts and
decided to use lambdas and step functions to orchestrate a tool to query and
aggregate logs from across our many AWS accounts.

#### Design and Alternatives

We decided on using a step function with three high-level phases:

1. parse user query and partition into a CloudWatch query with a limited partition size
2. map over each CloudWatch query and start a CloudWatch Logs insights query
3. wait until all results are complete and aggregate into a single result sorted by timestamp

Each step would be executed by an AWS Lambda function and the entire workflow would be orchestrated by AWS Step Functions.
To get around the 256KB message size limit between each step, we'd have to write intermediate results to an S3 bucket and pass
around ARNs, as recommended by AWS (TODO: insert link).

**Why not just use X-Ray or a pre-built solution?**

We need to trace _every_ message in case of a possible lost message. X-ray
relies on message sampling and would not cover this use-caes.

#### Learnings

### Job Framework Orchestration

#### Purpose

#### Design and Alternatives

#### Learnings

## General Step Function Learnings

### Job Cleanup

Step Functions do seem to be oriented only to using Lambda compute. I had to
implement custom code to shutdown any "task started" as part of a workflow.
It's not hard but it's glue code I didn't expect I'd have to write.
