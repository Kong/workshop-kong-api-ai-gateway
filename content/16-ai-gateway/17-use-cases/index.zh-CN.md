---
title : "AI with Amazon Bedrock"
weight : 159
---

#### Kong人工智能网关

随着多家人工智能龙8国际娱乐城提供商的迅速崛起，人工智能技术领域变得支离破碎，缺乏标准和控制。Kong AI Gateway 是建立在Kong Gateway之上的一套强大功能，旨在帮助开发人员和企业快速、安全地有效采用人工智能功能。

虽然人工智能提供商并不符合标准的 API 规范，但 Kong AI Gateway 提供了一个规范化的 API 层，允许客户从相同的客户代码库中使用多种人工智能服务。人工智能网关通过提示工程为凭证管理、人工智能使用可观察性、治理和调整提供了额外的功能。开发人员可以使用无代码人工智能插件来丰富现有的 API 流量，从而轻松增强现有的应用功能。

您可以通过一组专门的插件启用 AI Gateway 功能，使用的模式与任何其他 Kong Gateway 插件相同。

![Kong AI Gateway Architecture](/static/images/ai-gateway.png)

* 功能范围

![Kong AI Gateway scope](/static/images/ai_gateway_scope.png)

#### Amazon Bedrock

Amazon Bedrock 是一项完全托管的服务，它通过单一 API 提供来自 AI21 Labs、Anthropic、Cohere、Meta、Mistral AI、Stability AI 和 Amazon 等领先人工智能公司的高性能基础模型 (FM) 以及您构建具有安全性、隐私性和负责任人工智能的生成式人工智能应用程序所需的广泛功能。

使用 Amazon Bedrock，您可以轻松地试验和评估适合您的使用案例的顶级 FM，使用微调和检索增强生成（RAG）等技术利用您的数据对其进行私人定制，并构建使用您的企业系统和数据源执行任务的代理。由于 Amazon Bedrock 是无服务器的，因此您无需管理任何基础架构，而且可以使用您已经熟悉的 AWS 服务将生成式人工智能功能安全地集成和部署到您的应用程序中。

本讲座中描述的用例将使用一些基础模型，包括
* Amazon:
    * Titan Text G1 - Express
* Meta:
    * Llama 3.1 70B Instruct
* Mistal AI:
    * Mistral 7B Instruct

#### 高级别任务
您将完成以下任务：
* 为 Bedrock 集成设置 Kong AI 代理
* 实施 Kong AI 插件以确保提示消息的安全

现在，您可以点击**Next**继续操作。
