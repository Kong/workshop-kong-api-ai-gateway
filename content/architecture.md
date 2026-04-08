---
title: "Kong Konnect Architectural Overview"
weight: 105
---

The Kong Konnect platform provides a cloud management control plane (CP), which manages all service configurations. Through specific [communication channels](https://developer.konghq.com/gateway/cp-dp-communication/), it propagates those configurations to all runtime data planes (DP), which store the configurations in a [LMDB database](https://konghq.com/blog/engineering/new-storage-engine-for-kong-hybrid-and-db-less-deployments). These data plane nodes can be installed anywhere, on-premise or in AWS.

![Konnect Architecture](/static/images/konnect-introduction-new.png)

For today's workshop, we will be focusing on Kong Gateway. Kong Gateway data plane listen for traffic on the proxy port 443 by default. The data plane evaluates incoming client API requests and routes them to the appropriate backend APIs, MCPs or GenAI models. While routing requests and providing responses, policies can be applied with plugins as necessary.


# Kong Gateway

Kong Gateway is a lightweight, fast, and flexible cloud-native API gateway. An API gateway is a reverse proxy that lets you manage, configure, and route requests to your APIs.

Kong Gateway runs in front of any RESTful API and can be extended through modules and plugins. It’s designed to run on decentralized architectures, including hybrid-cloud and multi-cloud deployments.

![Kong Gateway architecture diagram](/static/images/gateway.png)



# Gateway Manager (Control Plane)
Gateway Manager empowers your teams to securely collaborate and manage their own set of runtimes and services without the risk of impacting other teams and projects. Gateway Manager instantly provisions hosted Kong Gateway control planes and supports securely attaching Kong Gateway data planes from your cloud or hybrid environments.

Through the Gateway Manager, increase the security of your APIs with out-of-the-box enterprise and community plugins, including API-based (OpenID Connect, Open Policy Agent, Mutual TLS, and more) and IA-based (Semantic Caching, RAG Injector, Prompt Guard, etc.)


![Kong Gateway Manager control plane dashboard](/static/images/gateway_cp.png)

# Konnect Applications

Kong Konnect features are described in this section, including modules and plugins that extend and enhance the functionality of the Kong Konnect platform.

## Advanced Analytics
Use Analytics to gain deep insights into service, route, and application usage and health monitoring data. Keep your finger on the pulse of the health of your API products with custom reports and contextual dashboards. In addition, you can enhance the native monitoring and analytics capabilities with Kong Gateway plugins that enable streaming monitoring metrics to third-party analytics providers.

![Konnect Advanced Analytics API usage summary dashboard](/static/images/konnect-api-usage-summary.png)

## Dev Portal
Streamline developer onboarding with the Dev Portal, which offers a self-service developer experience to discover, register, and consume published services from your Service Hub catalog. This customizable experience can be used to match your own unique branding and highlights the documentation and interactive API specifications of your services. Enable application registration to automatically secure your APIs with a variety of authorization providers.

![Kong Dev Portal creation page](/static/images/create-portal.png)


## Catalog
A centralized catalog of all services running in your Konnect organization. It provides a centralized catalog of all services and APIs running in your organization. By integrating with internal applications, like Gateway Manager and Mesh Manager, and external tools, like GitHub and PagerDuty, it offers a 360-degree overview of your services, including:

* Service ownership details
* Upstream and downstream dependencies
* Associated code repositories and CI/CD pipelines
* API gateway and service mesh mappings
* Comprehensive API catalog



# Further Reading

* [Kong Gateway](https://developer.konghq.com/gateway/)
* [Gateway Manager](https://docs.konghq.com/konnect/gateway-manager/)
* [Advanced Analytics](https://docs.konghq.com/konnect/analytics/)
* [Dev Portal](https://docs.konghq.com/konnect/dev-portal/)
* [Catalog](https://developer.konghq.com/catalog/)