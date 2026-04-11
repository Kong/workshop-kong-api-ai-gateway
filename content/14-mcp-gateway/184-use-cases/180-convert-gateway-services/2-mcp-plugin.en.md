---
title : "Convert Kong Gateway Services into MCP Tools"
weight : 1802
---

Now, we are going to use the [AI MCP Proxy](https://developer.konghq.com/plugins/ai-mcp-proxy/) plugin to convert the Kong Gateway Service into MCP Tools.

Here's the new architecture:

![marketplace_mcp_arch](/static/images/marketplace_mcp_arch.png)


### Download the new decK file

* Download the **marketplace_mcp.yaml** Kong decK spec file.


```
curl 'http://localhost:8080/builds/static/code/marketplace_mcp.yaml' --output ./marketplace_mcp.yaml
```


### Submit the decK declaration to your Control Plane

```
deck gateway reset --konnect-control-plane-name kong-aws --konnect-token $PAT -f
deck gateway sync --konnect-control-plane-name kong-aws --konnect-token $PAT marketplace_mcp.yaml
```

You should see two Kong Gateway Services now:
* **ai-proxy-advanced-service**
* **marketplace**




## AI Proxy Advanced Plugin

The **ai-proxy-advanced-service** Kong Gateway Service has a Kong Route with the **AI Proxy Advanced** Plugin enabled. That's how we solve the LLM flow with Bedrock.

![marketplace_bedrock](/static/images/marketplace_bedrock.png)

In fact, this Service specification follows the same structured the Services we previously created. Here's the snippet:
```
- name: ai-proxy-advanced-service
  host: localhost
  port: 32000
  routes:
  - name: bedrock-route
    paths:
    - /bedrock-route
    plugins:
    - name: ai-proxy-advanced
      instance_name: ai-proxy-advanced-bedrock
      enabled: true
      config:
        targets:
        - model:
            provider: bedrock
            name: "us.anthropic.claude-sonnet-4-20250514-v1:0"
            options:
              bedrock:
                aws_region: us-west-2
          route_type: "llm/v1/chat"
          auth:
            allow_override: false
          logging:
            log_payloads: true
            log_statistics: true

```



## AI MCP Proxy Plugin

On the other hand, the **marketplace** Kong Gateway Service has another Kong Route with the **AI MCP Proxy** Plugin enabled. This plugin solves the MCP flow with the Kong Gateway Service.

![Marketplace MCP service configuration](/static/images/marketplace_mcp.png)


Let's check the **marketplace** Kong Gateway Service spec now. The first thing to note is that the Service has, besides the **Mocking** Plugin, the **AI MCP Proxy** Plugin. The **Mocking** Plugin has exactly the specifiction with the same OpenAPI Specification.

The **AI MCP Proxy** Plugin defines the MCP abstractions based on the Kong Gateway Service. In fact, the plugin configuration defines two MCP Tools:
* The **Get users** MCP Tool, based on the **/users** path. Again, the path is defined by the **Mocking** plugin.
* The **Get orders for a user** MCP Tool, based on the **/users/{userId}/orders** path.

Inside the "config" section, you can see the "mode: conversion-only" configuration. That means the plugin will convert the mocked RESTful API paths into MCP tools but will not expose them. Moreover, each AI MCP Proxy instance has been tagged as "mcp-tools".

The "tools" section of the AI MCP Proxy declaration is an OpenAPI snippet. It's used to instruct how the plugin should integrate with the external service. It has the following main configuration parameters:
* **method**: It's related to the HTTP method the plugin should use to consume the mocked service.
* **parameters**: it maps the API parameters the mocked service expects.

Here's the **AI MCP Proxy** snippet:

```
- name: marketplace
  url: http://localhost:32000
  routes:
  - name: marketplace-route
    paths:
    - /
    plugins:
    - name: ai-mcp-proxy
      instance_name: marketplace-mcp
      enabled: true
      tags:
      - mcp-tools
      config:
        mode: conversion-only
        tools:
        - description: Get users
          method: GET
          parameters:
          - description: Optional user ID
            in: query
            name: id
            required: false
            schema:
              type: string
          path: /users
        - description: Get orders for a user
          method: GET
          parameters:
          - description: User ID to filter orders
            in: query
            name: userid
            required: true
            schema:
              type: string
          path: /users/{userId}/orders/
    - name: mocking
      instance_name: marketplace-mock
      enabled: true
      config:
        api_specification: |-
          openapi: 3.0.0
...
```

## Exposing the MCP Tools

One last configuration is left: a Serviceless Route where we aggregate all MCP Tools as a MCP Server. Again, the configure the **AI MCP Proxy** plugin, this time with the "mode: listener" set. Besides it has the same "mcp-tools" tag to identity which MCP Tools should be aggregated. From the Consumer/Agent perspective all MCP Tools are consumable through this Kong Route's path: "/mcp-listener".

```
routes:
  - name: mcp-listener-route
    paths:
    - /mcp-listener
    plugins:
      - name: ai-mcp-proxy
        instance_name: marketplace-listener
        enabled: true
        config:
          mode: listener
          server:
            tag: mcp-tools
            timeout: 45000
          logging:
            log_statistics: true
            log_payloads: false
          max_request_body_size: 32768
```


You can now click **Next** to proceed further.
