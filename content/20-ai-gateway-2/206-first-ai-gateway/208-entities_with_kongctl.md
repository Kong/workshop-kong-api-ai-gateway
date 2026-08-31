---
title : "AI Gateway entities with kongctl"
weight : 208
---





## Convert decK to kongctl

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
- ref: openai1
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
      # - type: ip
      - type: consumer
      - type: model
        partition_by: true
        values:
        - gpt-4o
      limits:
      - limit: 500
        window_size: 60
      # - limit: 1000
      #   window_size: 3600



ai_gateway_identity_providers:
- ref: idp1
  ai_gateway: ai-gateway-1
  config:
    hide_credentials: true
    key_in_body: false
    key_in_header: true
    key_in_query: true
    key_names:
    - apikey
  display_name: key-auth1
  name: key-auth1
  type: key-auth



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



ai_gateway_models:
- ref: openai
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
    identity_providers:
    - key-auth1
  capabilities:
  - generate
EOF
```


```
export OPENAI_AUTH_HEADER="Bearer <YOUR_OPENAI_API_KEY>"
```

```
export CONSUMER_CREDENTIAL=123456
```




```
kongctl sync --pat $PAT -f ai-gateway.yaml --auto-approve
```


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
        ref: openai
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
        ref: openai-model
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
          identity_providers:
          - key-auth1
        capabilities:
        - generate
    identity_providers:
      - display_name: key-auth1
        name: key-auth1
        type: key-auth
        ref: idp1
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
        credentials:
          - display_name: credential1
            name: credential1
            ref: credential1
            type: api-key
            api_key: !env CONSUMER_CREDENTIAL
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
EOF
```