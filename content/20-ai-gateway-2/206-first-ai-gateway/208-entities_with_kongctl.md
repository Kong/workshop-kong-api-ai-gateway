---
title : "AI Gateway entities with kongctl"
weight : 208
---


## Check kongctl version
```
kongctl version
```

Expected result:
```
1.14.0
```



## Apply the declaration

The following declaration is divided in multiple section, one per [Kong AI Gateway Entity](https://developer.konghq.com/ai-gateway/entities/):
* [AI Model Provider](https://developer.konghq.com/ai-gateway/entities/ai-model-provider/): The AI Model Provider entity lets you securely store and manage credentials for connecting to upstream LLM services. Use AI Model Providers to:
  * Store API keys for your GenAI/LLM provider
  * Centrally manage and rotate credentials across multiple AI Models
  * Enforce consistent authentication across your deployments, etc.


* [AI Model](https://developer.konghq.com/ai-gateway/entities/ai-model/): The AI Model entity gives clients a single endpoint for one or more upstream LLMs through AI Gateway. Callers don’t need to know which AI Provider or model handles the request. Use AI Models to:
  * Expose multiple LLM providers behind one endpoint
  * Load-balance traffic across them
  * Add observability to model traffic
  * Attach policies for security and transformation


* [AI Policy](https://developer.konghq.com/ai-gateway/entities/ai-policy/): Create an AI Policy when you want to add governance, security, transformation, or observability to AI Gateway traffic. Check all [Kong AI Gateway Policies](https://developer.konghq.com/ai-gateway/policies/). For example:
  * Redact sensitive data with AI PII Sanitizer
  * Manage request volume with AI Rate Limiting Advanced
  * Validate prompts with AI Prompt Guard or other guardrail Policies
  * Track requests and responses for observability with logging Policies, etc.


* [AI Auth Strategy](https://developer.konghq.com/ai-gateway/entities/ai-auth-strategy/): Your AI Models, AI Agents, and AI MCP Servers often need access control. Some teams should reach certain AI Models, AI Agents, or AI MCP Servers and others should not, and you need a way to verify who is calling before a request consumes tokens or touches sensitive data. An AI Auth Strategy lets you declare an inbound authentication mechanism at the gateway level and attach it to specific AI Models, AI Agents, or AI MCP Servers. Use AI Auth Strategies to:
  * Authenticate API keys and map them to AI Consumers
  * Authenticate enterprise users through an existing identity provider (Okta, Azure AD, Google, or any OIDC-compliant IdP) without managing keys manually
  * Apply different authentication to different models, agents, or MCP servers. For example, API keys for internal automation and OIDC bearer tokens for user-facing applications.


* [AI Consumers](https://developer.konghq.com/ai-gateway/entities/ai-consumer/): An AI Consumer is the AI Gateway entity that identifies an external client consuming or using the AI APIs you publish through AI Gateway. Consumers can represent applications, services, or users who interact with your AI Models, AI Agents, and AI MCP Servers.




```
cat > ai-gateway.yaml << 'EOF'
_defaults:
  kongctl:
    namespace: kong

ai_gateways:
- ref: ai-gateway-1
  _external:
    selector:
        matchFields:
          name: "ai-gateway-1"


ai_gateway_model_providers:
- ref: openai_mp
  ai_gateway: ai-gateway-1
  name: openai
  display_name: openai
  type: openai
  config:
    auth:
      type: basic
      headers:
        - name: Authorization
          value: !env OPENAI_AUTH_HEADER


ai_gateway_models:
- ref: openai_m
  ai_gateway: ai-gateway-1
  enabled: true
  name: gpt-4o
  display_name: gpt-4o
  type: model
  formats:
  - type: openai
  config:
    route:
      paths:
      - /openai-route
      model:
        body_param: model
        values:
        - gpt-4o
  targets:
  - name: gpt-4o
    provider: openai
    config:
      type: openai
  access:
    auth_strategies:
    - key-auth1
  capabilities:
  - generate


ai_gateway_policies:
- ref: ai-rate-limiting-advanced1
  ai_gateway: ai-gateway-1
  enabled: true
  global: false
  name: ai-rate-limiting-advanced
  display_name: ai-rate-limiting-advanced1
  type: ai-rate-limiting-advanced
  config:
    strategy: local
    policies:
    - match:
      - type: model
        partition_by: true
        values:
        - gpt-4o
      limits:
      - limit: 500
        window_size: 60


ai_gateway_auth_strategies:
- ref: auth_strategy_1
  display_name: key-auth1
  name: key-auth1
  type: key-auth
  ai_gateway: ai-gateway-1
  config:
    hide_credentials: true
    key_in_body: false
    key_in_header: true
    key_in_query: true
    key_names:
    - apikey


ai_gateway_consumers:
- ref: consumer1
  ai_gateway: ai-gateway-1
  display_name: consumer1
  name: consumer1
  type: api-key
  policies:
  - !ref ai-rate-limiting-advanced1
  credentials:
  - ref: credential1
    name: credential1
    display_name: credential1
    type: api-key
    api_key: !env CONSUMER_CREDENTIAL
EOF
```


### Set the environment variables
```
export OPENAI_AUTH_HEADER="Bearer <YOUR_OPENAI_API_KEY>"
```

```
export CONSUMER_CREDENTIAL=123456
```


## Apply the declaration with **kongctl**

```
kongctl sync -f ai-gateway.yaml --pat $PAT --auto-approve
```


## Send a request to your Data Plane

```
curl -isX POST "http://${DATA_PLANE_LB}/openai-route/chat/completions" \
-H 'Content-Type: application/json' \
-H 'apikey: 123456' \
-d '{
  "model": "gpt-4o",
  "messages": [
    {
      "role": "user",
      "content": "How does Kong AI Gateway work?"
    }
  ]
}'
```







## A second declaration

The same AI Gateway Entities can be declared with a single section like this:


```
cat > ai-gateway.yaml << 'EOF'
ai_gateways:
  - ref: ai-gateway-1
    _external:
      selector:
          matchFields:
            name: "ai-gateway-1"
    model_providers:
      - display_name: openai
        name: openai
        ref: openai_mp
        type: openai
        config:
          auth:
            type: basic
            headers:
              - name: Authorization
                value: !env OPENAI_AUTH_HEADER
    models:
      - name: gpt-4o
        display_name: gpt-4o
        ref: openai-m
        enabled: true
        type: model
        formats:
        - type: openai
        config:
          route:
            paths:
            - /openai-route
            model:
              body_param: model
              values:
              - gpt-4o
        targets:
        - name: gpt-4o
          provider: openai
          config:
            type: openai
        access:
          auth_strategies:
          - key-auth1
        capabilities:
        - generate
    policies:
      - name: ai-rate-limiting-advanced
        ref: ai-rate-limiting-advanced1
        type: ai-rate-limiting-advanced
        enabled: true
        display_name: ai-rate-limiting-advanced1
        config:
          strategy: local
          policies:
          - match:
            - type: model
              partition_by: true
              values:
              - gpt-4o
            limits:
            - limit: 500
              window_size: 60
    auth_strategies:
      - display_name: key-auth1
        name: key-auth1
        type: key-auth
        ref: auth_strategy_1
        config:
          hide_credentials: true
          key_in_body: false
          key_in_header: true
          key_in_query: true
          key_names:
          - apikey
    consumers:
      - display_name: consumer1
        name: consumer1
        ref: consumer1
        type: api-key
        policies:
        - !ref ai-rate-limiting-advanced1
        credentials:
          - display_name: credential1
            name: credential1
            ref: credential1
            type: api-key
            api_key: !env CONSUMER_CREDENTIAL
EOF
```