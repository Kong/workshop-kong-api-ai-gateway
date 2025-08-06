---
title : "Semantic Routing"
weight : 5
---


#### Semantic

The semantic algorithm distributes requests to different models based on the similarity between the prompt in the request and the description provided in the model configuration. This allows Kong to automatically select the model that is best suited for the given domain or use case. This feature enhances the flexibility and efficiency of model selection, especially when dealing with a diverse range of AI providers and models.


![Semantic Routing](/static/images/semantic_routing.png)



:::code{showCopyAction=true showLineNumbers=false language=shell}
cat > ai-proxy-advanced.yaml << 'EOF'
_format_version: "3.0"
_info:
  select_tags:
  - bedrock
_konnect:
  control_plane_name: kong-aws
services:
- name: ai-proxy-advanced-service
  host: localhost
  port: 32000
  routes:
  - name: route1
    paths:
    - /bedrock-route
    plugins:
    - name: ai-proxy-advanced
      instance_name: ai-proxy-advanced-bedrock
      config:
        balancer:
          algorithm: semantic
        embeddings:
          auth:
            param_name: "allow_override"
            param_value: "false"
            param_location: "body"
          model:
            provider: bedrock
            name: "amazon.titan-embed-text-v2:0"
            options:
              bedrock:
                aws_region: us-west-2
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
            provider: bedrock
            name: "us.amazon.nova-micro-v1:0"
            options:
              bedrock:
                aws_region: us-west-2
          route_type: "llm/v1/chat"
          auth:
            allow_override: false
          description: "mathematics, algebra, calculus, trigonometry"
        - model:
            provider: bedrock
            name: "us.meta.llama3-3-70b-instruct-v1:0"
            options:
              bedrock:
                aws_region: us-west-2
          route_type: "llm/v1/chat"
          auth:
            allow_override: false
          description: "piano, orchestra, liszt, classical music"
EOF
:::



Apply the declaration with decK:
:::code{showCopyAction=true showLineNumbers=false language=shell}
deck gateway reset --konnect-control-plane-name kong-aws --konnect-token $PAT -f
deck gateway sync --konnect-token $PAT ai-proxy-advanced.yaml
:::


Send a request related to Mathematics. The response should come from Amazon's Nova Micro model
:::code{showCopyAction=true showLineNumbers=false language=shell}
curl -s -X POST \
  --url $DATA_PLANE_LB/bedrock-route \
  --header 'Content-Type: application/json' \
  --data '{
     "messages": [
       {
         "role": "user",
         "content": "Tell me about the last theorem of Fermat"
       }
     ]
   }' | jq
:::


On the other hand, Llama3.3 should be responsible for requests related to Classical Music.

:::code{showCopyAction=true showLineNumbers=false language=shell}
curl -s -X POST \
  --url $DATA_PLANE_LB/bedrock-route \
  --header 'Content-Type: application/json' \
  --data '{
    "messages": [
      {
        "role": "user",
        "content": "Who wrote the Hungarian Rhapsodies piano pieces?"
      }
    ]
  }' | jq
:::

:::code{showCopyAction=true showLineNumbers=false language=shell}
curl -s -X POST \
  --url $DATA_PLANE_LB/bedrock-route \
  --header 'Content-Type: application/json' \
  --data '{
    "messages": [
      {
        "role": "user",
        "content": "Tell me a contemporaty pianist of Chopin"
      }
    ]
  }' | jq
:::


If you check Redis, you'll se there are two entries, related to the models
:::code{showCopyAction=true showLineNumbers=false language=shell}
kubectl exec -it $(kubectl get pod -n redis -o json | jq -r '.items[].metadata.name') -n redis -- redis-cli --scan
:::

* Expected output
```
"ai_proxy_advanced_semantic:01c84f59-b7c3-418b-818d-4369ef3e55ef:8f74aeaab95482bb37fbd69cd42154dcd6d321e1631ffdfd1802e1609d4c2481"
"ai_proxy_advanced_semantic:01c84f59-b7c3-418b-818d-4369ef3e55ef:72a33ce9079fd34f6fb3624c3a4ba1a0df0c1aad267986db2249dc26a8808a41"
```