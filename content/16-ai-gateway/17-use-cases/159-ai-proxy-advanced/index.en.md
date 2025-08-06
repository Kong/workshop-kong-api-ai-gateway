---
title : "AI Proxy Advanced plugin"
weight : 159
---

The **AI Proxy Advanced** plugin lets you transform and proxy requests to multiple AI providers and models at the same time. This lets you set up load balancing between targets.

The plugin accepts requests in one of a few defined and standardised formats, translates them to the configured target format, and then transforms the response back into a standard format.


### Load balancing
This plugin supports several load-balancing algorithms, similar to those used for Kong upstreams, allowing efficient distribution of requests across different AI models. The supported algorithms include:

* **Lowest-usage**
* **Round-robin** (weighted)
* **Consistent-hashing** (sticky-session on given header value)



### Semantic routing

The AI Proxy Advanced plugin supports semantic routing, which enables distribution of requests based on the similarity between the prompt and the description of each model. This allows Kong to automatically select the model that is best suited for the given domain or use case.

By analyzing the content of the request, the plugin can match it to the most appropriate model that is known to perform better in similar contexts. This feature enhances the flexibility and efficiency of model selection, especially when dealing with a diverse range of AI providers and models.

As a illustration here is the architecture where we are going to implement the multiple load balancing policies. AI Proxy Advanced will manage both Bedrock's LLM models:
* us.amazon.nova-lite-v1:0
* us.meta.llama3-3-70b-instruct-v1:0

![ai_proxy_advanced](/static/images/ai_proxy_advanced.png)


You can now click **Next** to proceed further.