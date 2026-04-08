---
title : "Kong Gateway Service, Kong Route and Kong Plugin"
weight : 121
---



![kong_entities](/static/images/kong_entities.png)


Kong Gateway can proxy:
* Layer 7 protocol, including: REST, GraphQL, gRPC, Websocket, SOAP, Kafka
* Layer 4 TCP and UDP Streaming


## Kong Gateway Service

**Gateway Services** represent the upstream services in your system. These applications are the business logic components of your system responsible for responding to requests.

The configuration of a Gateway Service defines the connectivity details between the Kong Gateway and the upstream service, along with other metadata. Generally, you should map one Gateway Service to each upstream service.

For simple deployments, the upstream URL can be provided directly in the Gateway Service. For sophisticated traffic management needs, a Gateway Service can point at an **Upstream**.

In the following diagram, seven Kong Gateway Services objects should be defined in Kong.


![kong_service](/static/images/kong_service.png)


## Kong Route

Gateway Services, in conjunction with **Routes**, let you expose your upstream services to clients with Kong Gateway, defining an entry point for client requests.

A Kong Route defines rules that match client requests and associate them with a Kong Service. Routing can occur by PATH, URI, HEADERS, etc.

A Kong Service can have many Kong Routes associated with it.

![kong_service](/static/images/kong_route.png)


## Kong Plugin

**Plugins** can be attached to a Service, and will run against every request that triggers a request to the Service that they’re attached to.

**Plugins** extend the functionality of Kong Gateway. They can be applied to different entities (i.e. Routes, Services, etc.).

![kong_service](/static/images/kong_plugin.png)

Kong Gateway provides 90+ plugins out of the box and allows for Custom Plugins to be created 

![kong_service](/static/images/kong_plugin_categories.png)


