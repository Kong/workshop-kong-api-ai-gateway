---
title: "API Management with Kong Konnect"
weight: 0
---

# Introduction

Kong Konnect is an API lifecycle management platform delivered as a service. The management plane is hosted in the cloud by Kong, while the runtime environments are deployed in your personal environment. Management plane enables customers to securely execute API management activities such as create API routes, define services etc. Runtime environments connect with the management plane using mutual transport layer authentication (mTLS), receive the updates and take customer facing API traffic.

# Learning Objectives

In this workshop, you will:

* Get an architectural overview of Kong Konnect platform.
* Set up Konnect runtime on Kubernetes Cluster.
* Learn what are services, routes and plugin.
* Deploy a sample microservice and access the application using the defined route.
* Use the platform to address the following API Gateway use cases
    * Proxy caching
    * Authentication and Authorization
    * Response Transformer
    * Request Callout
    * Rate limiting
    * Observability
    <!-- * Invoke AWS Lambda -->

* The following AI Gateway use cases
    * Prompt Engineering
    * LLM-based Request and Reponse transformation
    * Semantic Caching
    * Token-based Rate Limiting
    * Semantic Routing
    * RAG - Retrieval-Augmented Generation

* And the following MCP Gateway use cases
    * Convert Kong Gateway Services into MCP Tools
    * Implement OAuth 2 specification for MCP Servers with Kong Identity
    * Securing existing MCP Server
    * Kong AI/MCP Gateway, Claude Code and Anthropic

