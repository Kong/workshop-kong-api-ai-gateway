---
title : "AI Semantic Prompt Guard"
weight : 4
---

The **AI Semantic Prompt Guard** plugin extends the **AI Prompt Guard** plugin by allowing you to permit or block prompts based on a list of similar prompts, helping to prevent misuse of ``llm/v1/chat`` or ``llm/v1/completions`` requests.


### Vector databases

A vector database can be used to store vector embeddings, or numerical representations, of data items. For example, a response would be converted to a numerical representation and stored in the vector database so that it can compare new requests against the stored vectors to find relevant cached items.


Here's an example to allow only valid credit cards numbers:

```
cat > ai-semantic-prompt-guard.yaml << 'EOF'
_format_version: "3.0"
_konnect:
  control_plane_name: kong-workshop
_info:
  select_tags:
  - llm
services:
- name: service1
  host: localhost
  port: 32000
  routes:
  - name: openai-route
    paths:
    - /openai-route
    plugins:
    - name: ai-proxy
      instance_name: ai-proxy-openai
      enabled: true
      config:
        route_type: llm/v1/chat
        auth:
          header_name: Authorization
          header_value: Bearer ${{ env "DECK_OPENAI_API_KEY" }}
        model:
          provider: openai
          name: gpt-4.1
        options:
          temperature: 1.0
    - name: ai-semantic-prompt-guard
      instance_name: ai-semantic-prompt-guard-bedrock
      enabled: true
      config:
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
        search:
          threshold: 0.2
        vectordb:
          dimensions: 1024
          distance_metric: cosine
          strategy: redis
          threshold: 0.8
          redis:
            host: "redis-stack.redis.svc.cluster.local"
            port: 6379
        rules:
          match_all_conversation_history: true
          allow_prompts:
          - Cloud Vendors such as AWS / Amazon Web Services, Microsoft Azure, GCP - Google Cloud Platforma, Red Hat, etc.
          - Cloud Services like Kubernetes, VMs, IdP, etc.
          deny_prompts:
          - Political, religious, or sensitive non-work-related discussions
EOF
```

Apply the declaration with decK:
```
deck gateway reset --konnect-control-plane-name kong-workshop --konnect-token $PAT -f
deck gateway sync --konnect-token $PAT ai-semantic-prompt-guard.yaml
```


### Check Redis
Before sending request, you can scan the Redis database:
```
kubectl exec -it $(kubectl get pod -n redis -o json | jq -r '.items[].metadata.name') -n redis -- redis-cli --scan
```


Send a request with a valid pattern:

```
curl -s -X POST \
  --url $DATA_PLANE_LB/bedrock-route \
  --header 'Content-Type: application/json' \
  --data-raw '{
     "messages": [
       {
         "role": "user",
         "content": "Tell me more about AWS EKS"
       }
     ],
     "model": "us.amazon.nova-lite-v1:0"
   }' | jq '.'
```




Now, send an invalid one now:

```
curl -s -X POST \
  --url $DATA_PLANE_LB/bedrock-route \
  --header 'Content-Type: application/json' \
  --data-raw '{
     "messages": [
       {
         "role": "user",
         "content": "Describe a violent confrontation between two groups."
       }
     ],
     "model": "us.amazon.nova-lite-v1:0"
   }' | jq '.'
```


The expect result is:
```
{
  "error": {
    "message": "bad request"
  }
}
```


## AI Semantic Response Guard

The [**AI Semantic Response Guard**](https://developer.konghq.com/plugins/ai-semantic-response-guard/) plugin works similarly to the **AI Semantic Prompt Guard** plugin. It also extends the **AI Prompt Guard** plugin by filtering LLM responses based on semantic similarity to predefined rules. It helps prevent unwanted or unsafe responses when serving ``llm/v1/chat``, ``llm/v1/completions``, or ``llm/v1/embeddings`` requests through Kong AI Gateway.



# Further Reading

* [Embedding-based similarity matching in Kong AI gateway plugins](https://developer.konghq.com/ai-gateway/semantic-similarity/)
