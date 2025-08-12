---
title : "Lowest-Latency and Lowest-Usage"
weight : 4
---


#### Lowest Latency policy

The lowest-latency algorithm is based on the response time for each model. It distributes requests to models with the lowest response time.

Create a file with the following declaration:

```
cat > ai-proxy-advanced.yaml << 'EOF'
_format_version: "3.0"
_info:
  select_tags:
  - llm
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
          algorithm: lowest-latency
          latency_strategy: e2e
        targets:
        - model:
            provider: openai
            name: gpt-4.1
            options:
              temperature: 1.0
          route_type: "llm/v1/chat"
          auth:
            header_name: Authorization
            header_value: Bearer ${{ env "DECK_OPENAI_API_KEY" }}
        - model:
            provider: llama2
            name: llama3.2:1b
            options:
              llama2_format: ollama
              upstream_url: http://ollama.ollama:11434/api/chat
          route_type: "llm/v1/chat"
EOF
```

Apply the declaration with decK:

```
deck gateway reset --konnect-control-plane-name kong-workshop --konnect-token $PAT -f
deck gateway sync --konnect-token $PAT ai-proxy-advanced.yaml
```

Test the Route again.

```
curl -s -X POST \
  --url $DATA_PLANE_LB/route1 \
  --header 'Content-Type: application/json' \
  --data '{
     "messages": [
       {
         "role": "user",
         "content": "Who is considered the greatest Polish writer?"
       }
     ]
   }' | jq
```

#### Lowest Usage policy

The lowest-usage algorithm in **AI Proxy Advanced** is based on the volume of usage for each model. It balances the load by distributing requests to models with the lowest usage, measured by factors such as prompt token counts, response token counts, or other resource metrics.

Replace the declaration:


```
cat > ai-proxy-advanced.yaml << 'EOF'
_format_version: "3.0"
_info:
  select_tags:
  - llm
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
          algorithm: lowest-usage
        targets:
        - model:
            provider: openai
            name: gpt-4.1
            options:
              temperature: 1.0
          route_type: "llm/v1/chat"
          auth:
            header_name: Authorization
            header_value: Bearer ${{ env "DECK_OPENAI_API_KEY" }}
        - model:
            provider: llama2
            name: llama3.2:1b
            options:
              llama2_format: ollama
              upstream_url: http://ollama.ollama:11434/api/chat
          route_type: "llm/v1/chat"
EOF
```





Apply the declaration:

```
deck gateway reset --konnect-control-plane-name kong-aws --konnect-token $PAT -f
deck gateway sync --konnect-token $PAT ai-proxy-advanced.yaml
```


And test the Route again.

```
curl -s -X POST \
  --url $DATA_PLANE_LB/route1 \
  --header 'Content-Type: application/json' \
  --data '{
     "messages": [
       {
         "role": "user",
         "content": "Who is considered the greatest Polish writer?"
       }
     ]
   }' | jq
```