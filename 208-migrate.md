---
title : "Migrate to AI Gateway 2"
weight : 208
---



https://developer.konghq.com/ai-gateway/v2-migration-guide/

```
kongctl list extensions
```


```
Extensions
✓  kong/ai-gateway-converter  installed  v0.5.0
  Commands
    • kongctl convert ai-gateway
    • kongctl convert ai-gateway version
```

```
kongctl uninstall extension kong/ai-gateway-converter
```

```
kongctl install extension kong/kongctl-ext-aigw-converter
```

```
cat > ai-proxy-advanced.yaml << 'EOF'
_format_version: "3.0"
_konnect:
  control_plane_name: kong-workshop
services:
- name: ai-proxy-advanced-service
  host: localhost
  port: 32000
  routes:
  - name: route1
    paths:
    - /route1
    plugins:
    - name: ai-proxy-advanced
      instance_name: ai-proxy-advanced1
      config:
        balancer:
          algorithm: round-robin
        targets:
        - model:
            provider: openai
            name: gpt-4.1
            options:
              temperature: 1.0
          route_type: "llm/v1/chat"
          auth:
            header_name: Authorization
            header_value: Bearer abc
EOF
```



```
kongctl convert ai-gateway \
  --input ai-proxy-advanced.yaml \
  --config ./config \
  --out ./out
```


```
kongctl apply -f ./out --pat $PAT
```
