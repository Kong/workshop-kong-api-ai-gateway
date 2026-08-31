---
title: "API and AI Management with Kong Konnect"
weight: 0
---

# Introduction

Kong Konnect unifies and manages APIs, LLMs, events, and microservices with a single, centralized management plane, giving you consistent visibility and control across your entire API ecosystem. It uniquely combines a control plane, managed by Kong and hosted in the cloud, with the versatility of managing the data plane on your terms—either self-managed or through Kong, within your preferred network environment.

# Learning Objectives

In this workshop, you will:

* Get an architectural overview of Kong Konnect platform.
* Set up Konnect runtime on Kubernetes Cluster.
* Learn what are Kong Gateway Services, Kong Routes and Kong Plugins.
* Deploy a sample microservice and access the application using the defined route.
* Use the platform to address the following API Gateway use cases
    * Proxy caching
    * Authentication and Authorization
    * Response Transformer
    * Request Callout
    * Rate limiting
    * Observability
    <!-- * Invoke AWS Lambda -->

* Kong AI Gateway:
    * Kong LLM Gateway use cases
        * Prompt Engineering
        * LLM-based Request and Response transformation
        * Semantic Caching
        * Token-based Rate Limiting
        * Semantic Routing
        * RAG - Retrieval-Augmented Generation

    * Kong MCP Gateway use cases
        * Convert Kong Gateway Services into MCP Tools
        * Implement OAuth 2 specification for MCP Servers with Kong Identity
        * Securing existing MCP Server
        * Kong AI/MCP Gateway, Claude Code and Anthropic

    * Kong Agent Gateway introduction

* Kong AI Gateway 2 Introduction
    * Create a Kong AI Gateway 2 Control Plane and Data Plane with Kong Operator
    * Create new Kong AI Gateway 2 entities with kongctl

