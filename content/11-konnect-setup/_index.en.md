---
title : "Konnect Setup"
weight : 110
---

This chapter will walk you through

* Konnect Control Plane and Data Plane creation using Kong Gateway Operator (KGO).
* Scale Kong data plane nodes on Kubernetes using HPA - Horizontal Pod Autoscaler. 
* Access Kong data plane through Minikube tunnel

Here's a Reference Architecture that will be implemented in this workshop:

![kong](/static/images/ref_arch.png)

* Kong Konnect Control Plane: responsible for managing your APIs
* Kong Konnect Data Plane: connected to the Control Plane, it is responsible for processing all the incoming requests sent by the consumers.
* Kong provides a plugin framework, where each one of them is responsible for a specific functionality. As a can see, there are two main collections of plugins:
    *  On the left, the historic and regular API Gateway plugins, implementing all sort of policies including, for example, OIDC based Authentication processes with Keycloak, Amazon Cognito and Okta or Observability with Prometheus/Grafana and Dynatrace.
    * On the right, another plugin collection for AI-based use cases. For example, the AI Rate Limiting plugin implements policies like this based on the number of tokens consumed be the requests. Or, as another example is the AI Semantic Cache plugin, which caches data based on the semantics related to the responses coming from the LLM models.
* Kong AI Gateway supports, out of the box, a variety of infrastructures, including not just OpenAI, but also Amazon Bedrock, Google Gemini, Mistral, Anthropic, etc. In order to deal with embeddings, the Gateway also supports also vector databases.
* Kong Gateway protects not just the LLM Models but also the upstream services, including your application micros surfaces or services.

### Konnect Control Plane
After Konnect registration, you need to create your first Control Plane. There are multiple ways to do it:
* Konnect User Interface.
* [RESTful Admin API](https://developer.konghq.com/api/), a fundamental mechanism for administration purposes.
* [Kong Gateway Operator (KGO)](https://developer.konghq.com/operator/) and Kubernetes CRDs

To get an easier and faster deployment, this workshop uses KGO. You may observe the output in Konnect UI.

This tutorial is intended to be used for labs and PoC only. There are many aspects and processes, typically implemented in production sites, not described here. For example: Digital Certificate issuing, Cluster monitoring, etc. For a production ready deployment, refer Kong on Terraform Constructs, available [here](https://developer.konghq.com/terraform/)

You can now click **Next** to begin the module.