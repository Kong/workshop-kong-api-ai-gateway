---
title : "Semantic Routing"
weight : 5
---


#### Semantic

The semantic algorithm distributes requests to different models based on the similarity between the prompt in the request and the description provided in the model configuration. This allows Kong to automatically select the model that is best suited for the given domain or use case. This feature enhances the flexibility and efficiency of model selection, especially when dealing with a diverse range of AI providers and models.


![Semantic Routing](/static/images/semantic_routing.png)



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
          algorithm: semantic
        embeddings:
          auth:
            header_name: Authorization
            header_value: Bearer ${{ env "DECK_OPENAI_API_KEY" }}
          model:
            provider: openai
            name: "text-embedding-3-small"
        vectordb:
          dimensions: 1024
          distance_metric: cosine
          strategy: redis
          threshold: 1.0
          redis:
            host: "redis-stack.redis.svc.cluster.local"
            port: 6379
            database: 0
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
          description: "mathematics, algebra, calculus, trigonometry"
        - model:
            provider: llama2
            name: llama3.2:1b
            options:
              llama2_format: ollama
              upstream_url: http://ollama.ollama:11434/api/chat
          route_type: "llm/v1/chat"
          description: "piano, orchestra, liszt, classical music"
EOF
```



Apply the declaration with decK:
```
deck gateway reset --konnect-control-plane-name kong-workshop --konnect-token $PAT -f
deck gateway sync --konnect-token $PAT ai-proxy-advanced.yaml
```


Send a request related to Mathematics. The response should come from OpenAI's gpt-4.1
```
curl -s -X POST \
  --url $DATA_PLANE_LB/route1 \
  --header 'Content-Type: application/json' \
  --data '{
     "messages": [
       {
         "role": "user",
         "content": "Tell me about the last theorem of Fermat"
       }
     ]
   }' | jq
```


On the other hand, Llama3.1 should be responsible for requests related to Classical Music.

```
curl -s -X POST \
  --url $DATA_PLANE_LB/route1 \
  --header 'Content-Type: application/json' \
  --data '{
    "messages": [
      {
        "role": "user",
        "content": "Who wrote the Hungarian Rhapsodies piano pieces?"
      }
    ]
  }' | jq
```

```
curl -s -X POST \
  --url $DATA_PLANE_LB/route1 \
  --header 'Content-Type: application/json' \
  --data '{
    "messages": [
      {
        "role": "user",
        "content": "Tell me a contemporaty pianist of Chopin"
      }
    ]
  }' | jq
```


If you check Redis, you'll se there are two entries, related to the models
```
kubectl exec -it $(kubectl get pod -n redis -o json | jq -r '.items[].metadata.name') -n redis -- redis-cli --scan
```

* Expected output
```
"ai_proxy_advanced_semantic:01c84f59-b7c3-418b-818d-4369ef3e55ef:8f74aeaab95482bb37fbd69cd42154dcd6d321e1631ffdfd1802e1609d4c2481"
"ai_proxy_advanced_semantic:01c84f59-b7c3-418b-818d-4369ef3e55ef:72a33ce9079fd34f6fb3624c3a4ba1a0df0c1aad267986db2249dc26a8808a41"
```