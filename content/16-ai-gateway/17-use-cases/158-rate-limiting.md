---
title : "AI Rate Limiting Advanced"
weight : 158
---

With the existing API Key policy, we can control the incoming requests. However, the policies implemented by the other plugins are the same regardless the consumer.

In this section, we are going to define specific Rate Limiting policies for each Consumer represented by its API Key.

### Kong Consumer Policies

It's important then to be able to define specific policies for each one of these consumers. For example, it would be great to define Rate Limiting policies for different consumers like this:

* consumer1:
    * apikey = 123456
    * rate limiting policy = 500 tokens per minute
* consumer2:
    * apikey = 987654
    * rate limiting policy = 10000 tokens per minute

Doing that, the Data Plane is capable to not just protect the Route but to identify the consumer based on the key injected to enforce specific policies to the consumer. Keep in mind that a Consumer might have other plugins also enabled such as [TCP Log](https://docs.konghq.com/hub/kong-inc/tcp-log/), etc.


#### New Consumer and AI Rate Limiting Advanced plugin Policies

Then, create the second ``consumer2``, just like you did with the first one, with the ``987654`` key. Both Kong Consumers have the **AI Rate Limiting Advanced** plugin enabled with specific configurations.


```
cat > ai-key-auth-rate-limiting-advanced.yaml << 'EOF'
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
    - name: key-auth
      instance_name: key-auth-bedrock
      enabled: true
consumers:
- keyauth_credentials:
  - key: "123456"
  username: user1
  plugins:
  - name: ai-rate-limiting-advanced
    instance_name: ai-rate-limiting-advanced-consumer1
    config:
      llm_providers:
      - name: openai
        window_size:
        - 60
        limit:
        - 500
- keyauth_credentials:
  - key: "987654"
  username: user2  
  plugins:
  - name: ai-rate-limiting-advanced
    instance_name: ai-rate-limiting-advanced-consumer2
    config:
      llm_providers:
      - name: openai
        window_size:
        - 60
        limit:
        - 10000
EOF
```


Apply the declaration with decK:
```
deck gateway reset --konnect-control-plane-name kong-workshop --konnect-token $PAT -f
deck gateway sync --konnect-token $PAT ai-key-auth-rate-limiting-advanced.yaml
```


#### Use both Kong Consumers

If you will, you can inject both keys to your requests.

```
curl -i -X POST \
  --url $DATA_PLANE_LB/openai-route \
  --header 'Content-Type: application/json' \
  --header 'apikey: 123456' \
  --data '{
   "messages": [
     {
       "role": "user",
       "content": "Who is Jimi Hendrix?"
     }
   ]
  }'
```

* Expected output

```
HTTP/1.1 200 OK
Content-Type: application/json
Connection: keep-alive
X-AI-RateLimit-Limit-minute-openai: 500
X-AI-RateLimit-Remaining-minute-openai: 500
openai-version: 2020-10-01
x-envoy-upstream-service-time: 8059
Date: Tue, 12 Aug 2025 15:26:01 GMT
x-ratelimit-limit-requests: 500
x-ratelimit-limit-tokens: 30000
x-ratelimit-remaining-requests: 499
CF-RAY: 96e0fce49c204ee9-GRU
x-ratelimit-remaining-tokens: 29993
alt-svc: h3=":443"; ma=86400
access-control-expose-headers: X-Request-ID
X-Content-Type-Options: nosniff
Server: cloudflare
openai-organization: user-4qzstwunaw6d1dhwnga5bc5q
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
x-request-id: req_f230ff10e7374c7a8b2fc292a3cc0685
openai-processing-ms: 7964
cf-cache-status: DYNAMIC
openai-project: proj_r4KYFyenuGWthS5te4zaurNN
x-ratelimit-reset-tokens: 14ms
x-ratelimit-reset-requests: 120ms
X-Kong-LLM-Model: openai/gpt-4.1
Content-Length: 2058
X-Kong-Upstream-Latency: 8798
X-Kong-Proxy-Latency: 4
Via: 1.1 kong/3.11.0.2-enterprise-edition
X-Kong-Request-Id: 379bd531f3411379f613083969a88c07

{
  "id": "chatcmpl-C3lAneT4SCgIa50fe89CYPadtBdfQ",
  "object": "chat.completion",
  "created": 1755012353,
  "model": "gpt-4.1-2025-04-14",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Jimi Hendrix (born **James Marshall Hendrix**, November 27, 1942 – September 18, 1970) was an American guitarist, singer, and songwriter. He is widely regarded as one of the greatest and most influential electric guitarists in the history of popular music.\n\n**Career Highlights:**\n- Hendrix gained fame in the late 1960s with his band, **The Jimi Hendrix Experience**.\n- Some of his most famous songs include **\"Purple Haze,\" \"Hey Joe,\" \"The Wind Cries Mary,\"** and **\"All Along the Watchtower.\"**\n- He was known for his innovative guitar techniques, including feedback, distortion, and wah-wah, and his energetic and theatrical performance style.\n- Hendrix's legendary performances include his rendition of \"The Star-Spangled Banner\" at **Woodstock** in 1969.\n\n**Legacy:**\n- Despite his short career (he died at age 27), Hendrix's music and style had a major impact on rock, blues, and modern guitar playing.\n- He was posthumously inducted into the **Rock and Roll Hall of Fame** in 1992.\n- Hendrix is consistently ranked among the greatest guitarists of all time by music publications and critics.\n\n**Fun Fact:**  \nJimi Hendrix is part of the so-called \"27 Club,\" a group of influential musicians who died at the age of 27.",
        "refusal": null,
        "annotations": []
      },
      "logprobs": null,
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 13,
    "completion_tokens": 285,
    "total_tokens": 298,
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
  "system_fingerprint": "fp_b3f1157249"
}
```

or

```
curl -i -X POST \
  --url $DATA_PLANE_LB/openai-route \
  --header 'Content-Type: application/json' \
  --header 'apikey: 987654' \
  --data '{
   "messages": [
     {
       "role": "user",
       "content": "Who is Jimi Hendrix?"
     }
   ]
  }'
```

* Expected output

```
HTTP/1.1 200 OK
Content-Type: application/json
Connection: keep-alive
X-AI-RateLimit-Limit-minute-openai: 10000
X-AI-RateLimit-Remaining-minute-openai: 10000
x-ratelimit-limit-tokens: 30000
x-ratelimit-remaining-requests: 499
Date: Tue, 12 Aug 2025 15:26:41 GMT
x-ratelimit-remaining-tokens: 29993
access-control-expose-headers: X-Request-ID
openai-organization: user-4qzstwunaw6d1dhwnga5bc5q
openai-processing-ms: 6376
x-ratelimit-reset-requests: 120ms
openai-project: proj_r4KYFyenuGWthS5te4zaurNN
cf-cache-status: DYNAMIC
openai-version: 2020-10-01
Server: cloudflare
X-Content-Type-Options: nosniff
x-envoy-upstream-service-time: 6463
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
CF-RAY: 96e0fdeec8b7ae57-GRU
x-ratelimit-limit-requests: 500
x-request-id: req_f8c4559cbdac4d1bbff938b61a054f3d
x-ratelimit-reset-tokens: 14ms
alt-svc: h3=":443"; ma=86400
X-Kong-LLM-Model: openai/gpt-4.1
Content-Length: 2324
X-Kong-Upstream-Latency: 6709
X-Kong-Proxy-Latency: 3
Via: 1.1 kong/3.11.0.2-enterprise-edition
X-Kong-Request-Id: 6e2daa0a80e95772fa46e15637278177

{
  "id": "chatcmpl-C3lBT2cDacuuICQzugJ5CCMbWtCFV",
  "object": "chat.completion",
  "created": 1755012395,
  "model": "gpt-4.1-2025-04-14",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "**Jimi Hendrix** (born **James Marshall Hendrix**, November 27, 1942 – September 18, 1970) was an American guitarist, singer, and songwriter. Widely regarded as one of the greatest and most influential electric guitarists in the history of popular music, Hendrix is known for his innovative playing style, including groundbreaking use of guitar effects and techniques like feedback and distortion.\n\n### Brief Biography:\n- **Early Life:** Born in Seattle, Washington; started playing guitar as a teenager.\n- **Career:** Gained prominence in the mid-1960s after moving to England and forming the **Jimi Hendrix Experience** with bassist Noel Redding and drummer Mitch Mitchell.\n- **Famous Albums:** \n  - *Are You Experienced* (1967)\n  - *Axis: Bold as Love* (1967)\n  - *Electric Ladyland* (1968)\n- **Iconic Performances:** \n  - Monterey Pop Festival (1967)\n  - Woodstock Festival (1969), where he famously reinterpreted “The Star-Spangled Banner.”\n\n### Legacy:\nHendrix’s innovative approach fused rock, blues, and psychedelia. His use of the wah-wah pedal, feedback, and studio effects transformed notions of what the electric guitar could do. Despite his death at the age of 27, his influence persists across genres and generations.\n\n### Key Songs:\n- “Purple Haze”\n- “Hey Joe”\n- “All Along the Watchtower”\n- “Voodoo Child (Slight Return)”\n- “Little Wing”\n\nHendrix is a major figure in rock history and is frequently cited in “greatest guitarists of all time” lists.",
        "refusal": null,
        "annotations": []
      },
      "logprobs": null,
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 13,
    "completion_tokens": 346,
    "total_tokens": 359,
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


Again, test the rate-limiting policy by executing the following command multiple times and observe the rate-limit headers in the response, specially, ``X-AI-RateLimit-Limit-minute-openai`` and ``X-AI-RateLimit-Remaining-minute-openai``:



Now, let's consume it with the Consumer1's API Key. As you can see the Data Plane is processing the Rate Limiting processes independently.

```
curl -i -X POST \
  --url $DATA_PLANE_LB/openai-route \
  --header 'Content-Type: application/json' \
  --header 'apikey: 123456' \
  --data '{
   "messages": [
     {
       "role": "user",
       "content": "Who is Jimi Hendrix?"
     }
   ]
  }'
```


```
HTTP/1.1 200 OK
Content-Type: application/json
Connection: keep-alive
X-AI-RateLimit-Limit-minute-openai: 500
X-AI-RateLimit-Remaining-minute-openai: 110
x-ratelimit-limit-tokens: 30000
x-ratelimit-remaining-requests: 499
Date: Tue, 12 Aug 2025 15:29:05 GMT
x-ratelimit-remaining-tokens: 29993
access-control-expose-headers: X-Request-ID
openai-organization: user-4qzstwunaw6d1dhwnga5bc5q
openai-processing-ms: 4385
x-ratelimit-reset-requests: 120ms
openai-project: proj_r4KYFyenuGWthS5te4zaurNN
cf-cache-status: DYNAMIC
openai-version: 2020-10-01
Server: cloudflare
X-Content-Type-Options: nosniff
x-envoy-upstream-service-time: 4484
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
CF-RAY: 96e10178faf000f1-GRU
x-ratelimit-limit-requests: 500
x-request-id: req_b4611580cac4476288895c6315847b8b
x-ratelimit-reset-tokens: 14ms
alt-svc: h3=":443"; ma=86400
X-Kong-LLM-Model: openai/gpt-4.1
Content-Length: 1796
X-Kong-Upstream-Latency: 4881
X-Kong-Proxy-Latency: 1
Via: 1.1 kong/3.11.0.2-enterprise-edition
X-Kong-Request-Id: 8b4285448ad3b335f766d33c61a37851
```


If we keep sending requests using the first API Key, eventually, as expected, we'll get an error code:

```
curl -i -X POST \
  --url $DATA_PLANE_LB/openai-route \
  --header 'Content-Type: application/json' \
  --header 'apikey: 123456' \
  --data '{
   "messages": [
     {
       "role": "user",
       "content": "Who is Jimi Hendrix?"
     }
   ]
  }'
```

```
HTTP/1.1 429 Too Many Requests
Date: Tue, 12 Aug 2025 15:29:52 GMT
Content-Type: application/json; charset=utf-8
Connection: keep-alive
X-AI-RateLimit-Limit-minute-openai: 500
X-AI-RateLimit-Remaining-minute-openai: 0
X-AI-RateLimit-Retry-After-minute-openai: 9
X-AI-RateLimit-Reset: 9
X-AI-RateLimit-Retry-After: 9
X-AI-RateLimit-Reset-minute-openai: 9
Content-Length: 66
X-Kong-Response-Latency: 1
Server: kong/3.11.0.2-enterprise-edition
X-Kong-Request-Id: c3a2a05b8f77b264230f041c527ade71

{"message":"AI token rate limit exceeded for provider(s): openai"}
```

However, the second API Key is still allowed to consume the Kong Route:


```
curl -i -X POST \
  --url $DATA_PLANE_LB/openai-route \
  --header 'Content-Type: application/json' \
  --header 'apikey: 987654' \
  --data '{
   "messages": [
     {
       "role": "user",
       "content": "Who is Jimi Hendrix?"
     }
   ]
  }'
```

```
HTTP/1.1 200 OK
Content-Type: application/json
Connection: keep-alive
X-AI-RateLimit-Limit-minute-openai: 10000
X-AI-RateLimit-Remaining-minute-openai: 10000
openai-version: 2020-10-01
x-envoy-upstream-service-time: 5053
Date: Tue, 12 Aug 2025 15:30:26 GMT
x-ratelimit-limit-requests: 500
x-ratelimit-limit-tokens: 30000
x-ratelimit-remaining-requests: 499
CF-RAY: 96e103739ca64292-VCP
x-ratelimit-remaining-tokens: 29993
alt-svc: h3=":443"; ma=86400
access-control-expose-headers: X-Request-ID
X-Content-Type-Options: nosniff
Server: cloudflare
openai-organization: user-4qzstwunaw6d1dhwnga5bc5q
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
x-request-id: req_379758f4fcd549acb57c7e6d911b5a89
openai-processing-ms: 5014
cf-cache-status: DYNAMIC
openai-project: proj_r4KYFyenuGWthS5te4zaurNN
x-ratelimit-reset-tokens: 14ms
x-ratelimit-reset-requests: 120ms
X-Kong-LLM-Model: openai/gpt-4.1
Content-Length: 1998
X-Kong-Upstream-Latency: 5602
X-Kong-Proxy-Latency: 2
Via: 1.1 kong/3.11.0.2-enterprise-edition
X-Kong-Request-Id: 118caf09b62c8f4f78771c182f736b00

{
  "id": "chatcmpl-C3lF7AC6zeB8NOBFQn5Xeacn6Ntf7",
  "object": "chat.completion",
  "created": 1755012621,
  "model": "gpt-4.1-2025-04-14",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "**Jimi Hendrix** (born James Marshall Hendrix on November 27, 1942 – September 18, 1970) was an iconic American guitarist, singer, and songwriter. Widely regarded as one of the most influential electric guitarists in the history of popular music, Hendrix is celebrated for his innovative style, virtuosic playing, and groundbreaking use of guitar effects such as distortion, feedback, and wah-wah pedals.\n\nHendrix first gained fame in the mid-1960s after moving to London and forming the **Jimi Hendrix Experience** with bassist Noel Redding and drummer Mitch Mitchell. The band released classic albums such as *Are You Experienced* (1967), *Axis: Bold as Love* (1967), and *Electric Ladyland* (1968), featuring hit songs like \"Purple Haze,\" \"Hey Joe,\" \"The Wind Cries Mary,\" \"Voodoo Child (Slight Return),\" and his legendary rendition of \"The Star-Spangled Banner\" performed at Woodstock in 1969.\n\nTragically, Hendrix died at the young age of 27. Despite his short career, his influence continues to shape rock, blues, and popular music to this day. He is consistently ranked among the greatest guitarists of all time and has been inducted into the Rock and Roll Hall of Fame.",
        "refusal": null,
        "annotations": []
      },
      "logprobs": null,
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 13,
    "completion_tokens": 271,
    "total_tokens": 284,
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

Kong-gratulations! have now reached the end of this module by authenticating the API requests with a key and associating different consumers with policy plans. You can now click **Next** to proceed with the next module.

