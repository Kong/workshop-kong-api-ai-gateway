---
title : "AI with Amazon Bedrock"
weight : 159
---

#### Kong AI Gateway

With the rapid emergence of multiple AI LLM providers, the AI technology landscape is fragmented and lacking in standards and controls. Kong AI Gateway is a powerful set of features built on top of Kong Gateway, designed to help developers and organizations effectively adopt AI capabilities quickly and securely

While AI providers don’t conform to a standard API specification, the Kong AI Gateway provides a normalized API layer allowing clients to consume multiple AI services from the same client code base. The AI Gateway provides additional capabilities for credential management, AI usage observability, governance, and tuning through prompt engineering. Developers can use no-code AI Plugins to enrich existing API traffic, easily enhancing their existing application functionality.

You can enable the AI Gateway features through a set of specialized plugins, using the same model you use for any other Kong Gateway plugin.

![Kong AI Gateway Architecture](/static/images/ai-gateway.png)

* Kong AI Gateway functional scope

![Kong AI Gateway scope](/static/images/ai_gateway_scope.png)

#### Amazon Bedrock

Amazon Bedrock is a fully managed service that offers a choice of high-performing foundation models (FMs) from leading AI companies like AI21 Labs, Anthropic, Cohere, Meta, Mistral AI, Stability AI, and Amazon through a single API, along with a broad set of capabilities you need to build generative AI applications with security, privacy, and responsible AI.

Using Amazon Bedrock, you can easily experiment with and evaluate top FMs for your use case, privately customize them with your data using techniques such as fine-tuning and Retrieval Augmented Generation (RAG), and build agents that execute tasks using your enterprise systems and data sources. Since Amazon Bedrock is serverless, you don't have to manage any infrastructure, and you can securely integrate and deploy generative AI capabilities into your applications using the AWS services you are already familiar with.

The use case describe in this workshop will consume some Foundation Models, including:
* Amazon:
    * Nova Lite - amazon.nova-lite-v1:0
    * Nova Micro - amazon.nova-micro-v1:0
    * Titan Text Embeddings V2 - amazon.titan-embed-text-v2:0
* Meta:
    * Llama 3.3 70B Instruct v1 - meta.llama3-3-70b-instruct-v1:0



#### High Level Tasks
You will complete the following:
* Set up Kong AI Proxy for Bedrock Integration
* Implement Kong AI Plugins to secure prompt message

You can now click **Next** to proceed further.