---
title : "Kong AI Gateway 2"
weight : 200
---

AI Gateway 2 introduces a dedicated Control Plane for AI workloads in Konnect. Instead of requiring users to manually build AI behavior on top of API Kong Gateway through proxy plugins, AI Gateway exposes first-class AI entities: Providers, Models, MCP Servers, and Agents.

![AI Gateway 2](/static/images/ai-gateway-overview.svg)


## Architecture

![AI Gateway Architecture](/static/images/ai_gateway_architecture.png)

AI Gateway uses a hybrid deployment model, separating the control plane from the data plane.

* Control plane (fully managed by Konnect): a centralized UI and API to configure AI entities (AI Providers, AI Models, AI Agents, AI MCP Servers, AI Policies, AI Consumers, and more). It distributes that configuration to registered data plane nodes, along with the mutual TLS (mTLS) certificates those nodes use to authenticate. As in Kong Gateway hybrid mode, the control plane stays out of the data path: by default it doesn’t see the LLM, Model Context Protocol (MCP), or Agent-to-Agent (A2A) payloads passing through the data plane. A few opt-in settings can forward payload content to Konnect.

* Data plane (self-managed): proxy nodes running in your own infrastructure. They receive AI traffic (LLM requests, MCP traffic, and A2A communication), evaluate it against the policies the control plane distributes, and forward allowed traffic to upstream services. Each node maintains a persistent connection to the control plane to stay in sync with configuration changes.

## What’s changing

In AI Gateway running on Kong Gateway, AI functionality is delivered by three proxy plugins that extend Kong Gateway’s core proxying. You build Services and Routes, then attach a plugin to add AI behavior:

* AI Proxy Advanced provides model proxying, transformation, and load balancing across providers and models.
* AI MCP Proxy bridges Kong-managed Services to the Model Context Protocol, converting REST APIs into MCP tools or fronting upstream MCP servers.
* AI A2A Proxy adds observability and gateway control for Agent-to-Agent protocol traffic.

This model works, but it couples every AI concept to Kong Gateway primitives. A single logical model can require a Service, a Route, an AI Proxy Advanced plugin, and several supporting plugins, with the AI intent spread across all of them.

AI Gateway 2.x abstracts those plugins into a purpose-built entity model on its own control plane. You no longer need to configure Services, Routes, and plugins manually. Instead, you declare the AI resource you want, and the control plane provisions the underlying primitives for you.



## Entity mapping

The following table describes how the two models relate at a high level: a deployment with AI Gateway running on Kong Gateway is a collection of Services and Routes with AI plugins attached, while an AI Gateway 2.x deployment is a collection of AI Gateway entities managed under a single AI Gateway control plane.


| V1 (API Kong Gateway model) | V2 (Native AI Gateway model) | Description |
|-----------------------------|------------------------------|-------------|
| [AI Proxy Advanced](https://developer.konghq.com/plugins/ai-proxy-advanced/) on a Service or Route | [AI Model](https://developer.konghq.com/ai-gateway/entities/ai-model/) | One model entry per virtual model, with one or more `targets`. |
| Set `config.targets[].model.provider` on AI Proxy Advanced with inline auth | [AI Model Provider](https://developer.konghq.com/ai-gateway/entities/ai-model-provider) | Provider credentials are now declared once and reused across AI Model entities. |
| Set `config.targets[].route_type` on AI Proxy Advanced | Set `capabilities` and `formats.type` on an AI Model | The `route_type` is decomposed into a `capabilities` array and a format `type`. |
| Set `config.balancer` on AI Proxy Advanced | Set `config.balancer` on an AI Model | The same load balancing algorithms are available. |
| Set `config.vectordb` and `config.embeddings` on AI Proxy Advanced | Set `config.balancer.AIGatewayModelBalancerSemanticConfig.vectordb` and `config.balancer.AIGatewayModelBalancerSemanticConfig.embeddings` on an AI Model | Carried over with the same Redis and pgvector strategies. |
| [AI MCP Proxy](https://developer.konghq.com/plugins/ai-mcp-proxy/) on a Service or Route | [AI MCP Server](https://developer.konghq.com/ai-gateway/entities/ai-mcp-server/) | Each plugin `mode` maps directly to an AI MCP Server `type` value in version 2.x. Additionally, a new `upstream-server` type is available. |
| Set `config.default_acl` and `config.tools.acl` on AI MCP Proxy | Set `access` or `tools.access` on an AI MCP Server. Configure an AI Consumer or [AI Consumer Group](https://developer.konghq.com/ai-gateway/entities/ai-consumer-group/) | ACLs become first-class fields. |
| [AI A2A Proxy](https://deploy-preview-6582--kongdeveloper.netlify.app/plugins/ai-a2a-proxy/) on a Service or Route | [AI Agent](https://developer.konghq.com/ai-gateway/entities/ai-agent/) | First-class A2A support with URL rewriting and A2A analytics built in. |
| [Plugins](https://developer.konghq.com/plugins/?category=ai) | [Policies](https://developer.konghq.com/ai-gateway/policies/) | AI Policies replace plugins and can be attached to other entities. The `type` field on a Policy corresponds to the plugin. |
| Consumers and Consumer Groups | [AI Consumer](https://developer.konghq.com/ai-gateway/entities/ai-consumer/) and AI Consumer Group | Managed from the control plane. |
| Vault | [AI Vault](https://developer.konghq.com/ai-gateway/entities/ai-vault/) and [AI Data Plane Certificates](https://developer.konghq.com/ai-gateway/entities/ai-data-plane-certificate/) | Referenceable fields keep the same {vault://…} syntax. |



### Note the following terminology changes:

* AI Policies replace API Kong Gateway plugins. All AI Policies have some common parameters, in addition each AI Policy has a type which corresponds to a plugin from AI Gateway running on Kong Gateway, such as ai-sanitizer or openid-connect, and their config is the same as the plugin.
* AI Model Providers are now separate reusable entities. This decouples config and credentials of upstream providers from specific models, which allows you to declare an AI Model Provider once and reference it by name from multiple AI Models.
* A Route from AI Gateway running on Kong Gateway is split into two AI Gateway 2.x concepts: a capabilities list and a formats entry.