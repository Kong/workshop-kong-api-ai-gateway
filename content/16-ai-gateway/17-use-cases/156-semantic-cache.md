---
title : "AI Semantic Cache plugin"
weight : 156
---

Semantic caching enhances data retrieval efficiency by focusing on the meaning or context of queries rather than just exact matches. It stores responses based on the underlying intent and semantic similarities between different queries and can then retrieve those cached queries when a similar request is made.

When a new request is made, the system can retrieve and reuse previously cached responses if they are contextually relevant, even if the phrasing is different. This method reduces redundant processing, speeds up response times, and ensures that answers are more relevant to the user’s intent, ultimately improving overall system performance and user experience.

For example, if a user asks, “how to integrate our API with a mobile app” and later asks, “what are the steps for connecting our API to a smartphone application?”, the system understands that both questions are asking for the same information. It can then retrieve and reuse previously cached responses, even if the wording is different. This approach reduces processing time and speeds up responses.

The **AI Semantic Cache** plugin may not be ideal for you if:
* If you have limited hardware or budget. Storing semantic vectors and running similarity searches require a lot of storage and computing power, which could be an issue.
* If your data doesn’t rely on semantics, or exact matches work fine, semantic caching may offer little benefit. Traditional or keyword-based caching might be more efficient.

### How it works

The diagram below illustrates the semantic caching mechanism implemented by the **AI Semantic Cache** plugin.

![semantic_cache_plugin](/static/images/semantic_cache_plugin.png)

The process involves three parts: request handling, embedding generation, and response caching.
* First, a user starts a chat request with the LLM. The **AI Semantic Cache** plugin queries the vector database to see if there are any semantically similar requests that have already been cached. If there is a match, the vector database returns the cached response to the user.
* If there isn’t a match, the **AI Semantic Cache** plugin prompts the embeddings LLM to generate an embedding for the response.
* The **AI Semantic Cache** plugin uses a vector database and cache to store responses to requests. The plugin can then retrieve a cached response if a new request matches the semantics of a previous request, or it can tell the vector database to store a new response if there are no matches.

With the **AI Semantic Cache plugin**, you can configure a cache of your choice to store the responses from the LLM. Currently, the plugin supports **Redis** as a cache.

### Redis as a Vector database

We are going to configure the **AI Semantic Cache** to consume the Redis deployment available in the EKS Cluster. Redis, this time, will play the Vector database role.

### Apply the Semantic Cache plugin

```
cat > ai-semantic-cache.yaml << 'EOF'
_format_version: "3.0"
_info:
  select_tags:
  - semantic-cache
  - llm
_konnect:
  control_plane_name: kong-workshop
services:
- name: service1
  host: localhost
  port: 32000
  routes:
  - name: ollama-route
    paths:
    - /ollama-route
    plugins:
    - name: ai-proxy
      instance_name: ai-proxy-ollama
      config:
        route_type: llm/v1/chat
        model:
          provider: llama2
          name: llama3.2:1b
          options:
            llama2_format: ollama
            upstream_url: http://ollama.ollama:11434/api/chat
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
    - name: ai-semantic-cache
      instance_name: ai-semantic-cache-openai
      enabled: true
      config:
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
          threshold: 0.2
          redis:
            host: "redis-stack.redis.svc.cluster.local"
            port: 6379
EOF
```


Apply the declaration with decK:
```
deck gateway reset --konnect-control-plane-name kong-workshop --konnect-token $PAT -f
deck gateway sync --konnect-token $PAT ai-semantic-cache.yaml
```



### Check Redis
Before sending request, you can scan the Redis database:

```
kubectl exec -it $(kubectl get pod -n redis -o json | jq -r '.items[].metadata.name') -n redis -- redis-cli --scan
```

##### 1st Request

Since we don't have any cached data, the first request is going to return "Miss":

```
curl -i -X POST \
  --url $DATA_PLANE_LB/openai-route \
  --header 'Content-Type: application/json' \
   --data '{
   "messages": [
     {
       "role": "user",
       "content": "Who is Jimi Hendrix?"
     }
   ]
 }'
```

* Expected response
```
HTTP/1.1 200 OK
Content-Type: application/json
Connection: keep-alive
X-Cache-Status: Miss
x-ratelimit-limit-tokens: 30000
x-ratelimit-remaining-requests: 499
Date: Tue, 12 Aug 2025 14:47:48 GMT
x-ratelimit-remaining-tokens: 29993
access-control-expose-headers: X-Request-ID
openai-organization: user-4qzstwunaw6d1dhwnga5bc5q
openai-processing-ms: 7218
x-ratelimit-reset-requests: 120ms
openai-project: proj_r4KYFyenuGWthS5te4zaurNN
cf-cache-status: DYNAMIC
openai-version: 2020-10-01
Server: cloudflare
X-Content-Type-Options: nosniff
x-envoy-upstream-service-time: 7420
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
CF-RAY: 96e0c4e97b364d3b-GRU
x-ratelimit-limit-requests: 500
x-request-id: req_ae7f43291824451dbfec2a27b1a3ec2a
x-ratelimit-reset-tokens: 14ms
alt-svc: h3=":443"; ma=86400
X-Kong-LLM-Model: openai/gpt-4.1
Content-Length: 2005
X-Kong-Upstream-Latency: 8820
X-Kong-Proxy-Latency: 876
Via: 1.1 kong/3.11.0.2-enterprise-edition
X-Kong-Request-Id: 8fd73d1623140f675ed93b0dcb4aeb16

{
  "id": "chatcmpl-C3kZpdNpSx8eaIHhsLg14RhZgFBww",
  "object": "chat.completion",
  "created": 1755010061,
  "model": "gpt-4.1-2025-04-14",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "**Jimi Hendrix** (full name: James Marshall Hendrix, born November 27, 1942 – died September 18, 1970) was an American guitarist, singer, and songwriter, widely regarded as one of the most influential electric guitarists in the history of popular music. Emerging in the late 1960s, Hendrix revolutionized the way the guitar was played, using feedback, distortion, and an array of innovative techniques that transformed rock, blues, and psychedelic music.\n\nHendrix rose to fame with his band, **The Jimi Hendrix Experience**, delivering classic albums such as *Are You Experienced* (1967) and *Electric Ladyland* (1968). His groundbreaking performances included a legendary rendition of \"The Star-Spangled Banner\" at Woodstock in 1969.\n\nDespite his career only spanning about four years, Hendrix's influence endures through his recordings and his impact on generations of musicians. He was posthumously inducted into the Rock and Roll Hall of Fame in 1992. Some of his most famous songs include \"Purple Haze,\" \"Hey Joe,\" \"Voodoo Child (Slight Return),\" and \"All Along the Watchtower.\" Hendrix died at the age of 27, becoming one of the most iconic members of the so-called \"27 Club.\"",
        "refusal": null,
        "annotations": []
      },
      "logprobs": null,
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 13,
    "completion_tokens": 264,
    "total_tokens": 277,
    "prompt_tokens_details": {
      "cached_tokens": 0,
      "audio_tokens": 0
    },
    "completion_tokens_details": {
      "reasoning_tokens": 0,
      "audio_tokens": 0,
      "accepted_prediction_tokens": 0,
      "rejected_prediction_tokens": 0
    }
  },
  "service_tier": "default",
  "system_fingerprint": "fp_51e1070cf2"
}
```


##### Check Redis again

The Redis database has an entry now:
```
kubectl exec -it $(kubectl get pod -n redis -o json | jq -r '.items[].metadata.name') -n redis -- redis-cli --scan
```

* Expected response

```
"kong_semantic_cache:c6dbe643-42af-421a-a094-de7735ebff12:openai-gpt-4.1:2351ee4c78c607bf3c6123e98680647d3601e1b054b783cb589e05cf3d163e36"
```



##### 2nd Request
The Semantic Cache plugin will use the cached data for similar requests:

```
curl -i -X POST \
  --url $DATA_PLANE_LB/openai-route \
  --header 'Content-Type: application/json' \
   --data '{
   "messages": [
     {
       "role": "user",
       "content": "Tell me more about Jimi Hendrix"
     }
   ]
 }'
```


* Expected response

```
HTTP/1.1 200 OK
Date: Tue, 12 Aug 2025 14:48:55 GMT
Content-Type: application/json; charset=utf-8
Connection: keep-alive
X-Cache-Status: Hit
Age: 67
X-Cache-Key: kong_semantic_cache:c6dbe643-42af-421a-a094-de7735ebff12:openai-gpt-4.1:2351ee4c78c607bf3c6123e98680647d3601e1b054b783cb589e05cf3d163e36
X-Cache-Ttl: 233
Content-Length: 1814
X-Kong-Response-Latency: 1438
Server: kong/3.11.0.2-enterprise-edition
X-Kong-Request-Id: 2debcb5db5e6f3637bef912cca963a5d

{"object":"chat.completion","created":1755010061,"id":"2351ee4c78c607bf3c6123e98680647d3601e1b054b783cb589e05cf3d163e36","usage":{"completion_tokens":264,"prompt_tokens_details":{"cached_tokens":0,"audio_tokens":0},"completion_tokens_details":{"accepted_prediction_tokens":0,"audio_tokens":0,"rejected_prediction_tokens":0,"reasoning_tokens":0},"total_tokens":277,"prompt_tokens":13},"model":"gpt-4.1-2025-04-14","service_tier":"default","system_fingerprint":"fp_51e1070cf2","choices":[{"finish_reason":"stop","index":0,"logprobs":null,"message":{"annotations":{},"role":"assistant","refusal":null,"content":"**Jimi Hendrix** (full name: James Marshall Hendrix, born November 27, 1942 – died September 18, 1970) was an American guitarist, singer, and songwriter, widely regarded as one of the most influential electric guitarists in the history of popular music. Emerging in the late 1960s, Hendrix revolutionized the way the guitar was played, using feedback, distortion, and an array of innovative techniques that transformed rock, blues, and psychedelic music.\n\nHendrix rose to fame with his band, **The Jimi Hendrix Experience**, delivering classic albums such as *Are You Experienced* (1967) and *Electric Ladyland* (1968). His groundbreaking performances included a legendary rendition of \"The Star-Spangled Banner\" at Woodstock in 1969.\n\nDespite his career only spanning about four years, Hendrix's influence endures through his recordings and his impact on generations of musicians. He was posthumously inducted into the Rock and Roll Hall of Fame in 1992. Some of his most famous songs include \"Purple Haze,\" \"Hey Joe,\" \"Voodoo Child (Slight Return),\" and \"All Along the Watchtower.\" Hendrix died at the age of 27, becoming one of the most iconic members of the so-called \"27 Club.\""}}]}
```


##### 3rd Request
As expected, for a non-related request, the AI Gateway will hit the LLM to satisfy the query:

```
curl -i -X POST \
  --url $DATA_PLANE_LB/openai-route \
  --header 'Content-Type: application/json' \
   --data '{
   "messages": [
     {
       "role": "user",
       "content": "Who was Joseph Conrad?"
     }
   ]
 }'
```

* Expected response

```
HTTP/1.1 200 OK
Content-Type: application/json
Connection: keep-alive
X-Cache-Status: Miss
openai-version: 2020-10-01
x-envoy-upstream-service-time: 4746
Date: Tue, 12 Aug 2025 14:49:35 GMT
x-ratelimit-limit-requests: 500
x-ratelimit-limit-tokens: 30000
x-ratelimit-remaining-requests: 499
CF-RAY: 96e0c7a088ac1b20-GRU
x-ratelimit-remaining-tokens: 29992
alt-svc: h3=":443"; ma=86400
access-control-expose-headers: X-Request-ID
X-Content-Type-Options: nosniff
Server: cloudflare
openai-organization: user-4qzstwunaw6d1dhwnga5bc5q
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
x-request-id: req_10dee9e2989e46cbb32a2125f774f446
openai-processing-ms: 4658
cf-cache-status: DYNAMIC
openai-project: proj_r4KYFyenuGWthS5te4zaurNN
x-ratelimit-reset-tokens: 16ms
x-ratelimit-reset-requests: 120ms
X-Kong-LLM-Model: openai/gpt-4.1
Content-Length: 2515
X-Kong-Upstream-Latency: 4996
X-Kong-Proxy-Latency: 2222
Via: 1.1 kong/3.11.0.2-enterprise-edition
X-Kong-Request-Id: b5fadb69431d1234d8bbd53a71abc559

{
  "id": "chatcmpl-C3kbbMudkoKV6rrzvOHz0lQ8IH0Ci",
  "object": "chat.completion",
  "created": 1755010171,
  "model": "gpt-4.1-2025-04-14",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "**Joseph Conrad** (born Józef Teodor Konrad Korzeniowski; 1857–1924) was a Polish-British writer widely regarded as one of the great novelists writing in English, despite the fact that English was not his first language. He was born in Berdychiv, in the Russian Empire (now in Ukraine), to Polish parents.\n\n**Background:**\n- **Early Life:** Conrad’s parents were exiled for their involvement in Polish independence movements. Orphaned at a young age, he spent much of his youth in Poland and later France.\n- **Seafaring Career:** In his twenties, Conrad became a merchant marine, traveling around the world and eventually settling in England. He gained British citizenship in 1886.\n\n**Literary Career:**\n- He began writing novels and short stories in English, starting with *Almayer’s Folly* (1895).\n- **Notable works** include:\n  - *Heart of Darkness* (1899)\n  - *Lord Jim* (1900)\n  - *Nostromo* (1904)\n  - *The Secret Agent* (1907)\n- His novels often deal with themes of isolation, existential doubt, imperialism, and the complexity of human nature.\n\n**Legacy:**\n- Conrad’s innovative narrative techniques and psychological depth influenced modernist literature and writers such as Virginia Woolf, T.S. Eliot, and William Faulkner.\n- *Heart of Darkness*, a novella about a journey into the Congo, is considered one of the most important works of 20th-century literature and has inspired many adaptations, including the film *Apocalypse Now*.\n\n**Summary:**  \nJoseph Conrad was a Polish-born novelist who wrote in English and became one of the leading literary figures of his time, celebrated for his adventure tales, deep psychological insight, and exploration of moral ambiguity.",
        "refusal": null,
        "annotations": []
      },
      "logprobs": null,
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 12,
    "completion_tokens": 383,
    "total_tokens": 395,
    "prompt_tokens_details": {
      "cached_tokens": 0,
      "audio_tokens": 0
    },
    "completion_tokens_details": {
      "reasoning_tokens": 0,
      "audio_tokens": 0,
      "accepted_prediction_tokens": 0,
      "rejected_prediction_tokens": 0
    }
  },
  "service_tier": "default",
  "system_fingerprint": "fp_799e4ca3f1"
}
```



##### Check Redis again

Redis database has two entries now:

```
kubectl exec -it $(kubectl get pod -n redis -o json | jq -r '.items[].metadata.name') -n redis -- redis-cli --scan
```

* Expected response
```
"kong_semantic_cache:c6dbe643-42af-421a-a094-de7735ebff12:openai-gpt-4.1:2351ee4c78c607bf3c6123e98680647d3601e1b054b783cb589e05cf3d163e36"
"kong_semantic_cache:c6dbe643-42af-421a-a094-de7735ebff12:openai-gpt-4.1:42aa94b4bbbedce497e59e1fd0fc617683a43b58ac7e306a47feb46f502f1499"
```



Kong-gratulations! have now reached the end of this module by authenticating the API requests with a key and associating different consumers with policy plans. You can now click **Next** to proceed with the next module.


