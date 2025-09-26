---
title : "Kong AI Gateway"
weight : 170
---

### Introduction

With the rapid emergence of multiple AI LLM providers, the AI technology landscape is fragmented and lacking in standards and controls. Kong AI Gateway is a powerful set of features built on top of Kong Gateway, designed to help developers and organizations effectively adopt AI capabilities quickly and securely

While AI providers don’t conform to a standard API specification, the Kong AI Gateway provides a normalized API layer allowing clients to consume multiple AI services from the same client code base. The AI Gateway provides additional capabilities for credential management, AI usage observability, governance, and tuning through prompt engineering. Developers can use no-code AI Plugins to enrich existing API traffic, easily enhancing their existing application functionality.

You can enable the AI Gateway features through a set of specialized plugins, using the same model you use for any other Kong Gateway plugin.

![Kong AI Gateway Architecture](/static/images/ai-gateway.png)

* Kong AI Gateway functional scope

![Kong AI Gateway scope](/static/images/ai_gateway_scope.png)



#### Universal API

Kong’s AI Gateway Universal API, delivered through the AI Proxy and AI Proxy Advanced plugins, simplifies AI model integration by providing a single, standardized interface for interacting with models across multiple providers.

* Easy to use: Configure once and access any AI model with minimal integration effort.

* Load balancing: Automatically distribute AI requests across multiple models or providers for optimal performance and cost efficiency.

* Retry and fallback: Optimize AI requests based on model performance, cost, or other factors.

* Cross-plugin integration: Leverage AI in non-AI API workflows through other Kong Gateway plugins.


#### High Level Tasks
You will complete the following:
* Set up Kong AI Proxy for LLM Integration
* Implement Kong AI Plugins to secure prompt message

You can now click **Next** to proceed further.


## Optional Reading

Learn more about [Kong AI Gateway](https://docs.konghq.com/gateway/latest/ai-gateway/)


You can now click **Next** to begin the module.

