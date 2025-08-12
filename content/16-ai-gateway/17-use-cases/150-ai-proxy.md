---
title : "AI Proxy"
weight : 150
---

The [AI Proxy plugin](https://docs.konghq.com/hub/kong-inc/ai-proxy/configuration/) is the fundamental AI Gateway component. It lets you transform and proxy requests to a number of AI providers and models. The plugin accepts requests in one of a few defined and standardised formats, translates them to the configured target format, and then transforms the response back into a standard format.

![AI Proxy](/static/images/ai_proxy.png)


The following table describes which providers and requests the AI Proxy plugin supports:

![providers_support](/static/images/providers_support.png)

* Obs 1: OpenAI has marked [Completions](https://platform.openai.com/docs/api-reference/completions) as legacy and recommends using the [Chat Completions API](https://platform.openai.com/docs/guides/text?api-mode=responses) for developing new applications.

* Obs 2: Starting with Kong AI Gateway 3.11, new GenAI APIs are supported:

![genai_apis](/static/images/genai_apis.jpg)


## Getting Started with Kong AI Gateway

We are going to get started with a simple configuration. The following decK declaration enables the **AI Proxy** plugin to the Kong Gateway Service, to send requests to the LLM and consume the Ollama's **lamma3.2:1b** FM and OpenAI's **gpt-5** FM with **chat** LLM requests.

Update your **ai-proxy.yaml** file with that. Make sure you have the **DECK_OPENAI_API_KEY** environment variable set with your OpenAI's API Key.

```
cat > ai-proxy.yaml << 'EOF'
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
          name: gpt-5
          options:
            temperature: 1.0
EOF
```


Apply the declaration with decK:
```
deck gateway reset --konnect-control-plane-name kong-workshop --konnect-token $PAT -f
deck gateway sync --konnect-token $PAT ai-proxy.yaml
```


### OpenAI API

Kong AI Gateway provides one API to access all of the LLMs it supports. To accomplish this, Kong AI Gateway has standardized on the [OpenAI API specification](https://platform.openai.com/docs/api-reference). This will help developers to onboard more quickly by providing them with an API specification that they're already familiar with. You can start using LLMs behind the AI Gateway simply by redirecting your requests to a URL that points to a route of the AI Gateway.


### Send a request to Kong AI Gateway
Now, send a request to Kong AI Gateway following the [OpenAI API Chat](https://platform.openai.com/docs/api-reference/chat) specification as a reference:

```
curl -s -X POST \
  --url http://$DATA_PLANE_LB/openai-route \
  --header 'Content-Type: application/json' \
  --data '{
     "messages": [
       {
         "role": "user",
         "content": "what is pi?"
       }
     ]
   }' | jq
```

**Expected Output**

Note the response also complies to the OpenAI API spec:

```
{
     "messages": [
       {
         "role": "user",
         "content": "what is pi?"
       }
     ]
   }' | jq
{
  "id": "chatcmpl-C3jWHoMI65rb0Ojkai1NjBq0JoRMG",
  "object": "chat.completion",
  "created": 1755005997,
  "model": "gpt-5-2025-08-07",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Pi (π) is the mathematical constant equal to the ratio of a circle’s circumference to its diameter. It’s the same for all circles.\n\n- Approximate value: 3.141592653589793…\n- Nature: irrational (non-terminating, non-repeating) and transcendental.\n- Common formulas:\n  - Circumference: C = 2πr\n  - Area of a circle: A = πr²\n  - Appears widely, e.g., e^(iπ) + 1 = 0, normal distribution, waves/Fourier analysis.\n- Handy approximations: 22/7 ≈ 3.142857, 355/113 ≈ 3.14159292.\n\nIf you want more digits or historical background, say the word.",
        "refusal": null,
        "annotations": []
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 621,
    "total_tokens": 631,
    "prompt_tokens_details": {
      "cached_tokens": 0,
      "audio_tokens": 0
    },
    "completion_tokens_details": {
      "reasoning_tokens": 448,
      "audio_tokens": 0,
      "accepted_prediction_tokens": 0,
      "rejected_prediction_tokens": 0
    }
  },
  "service_tier": "default",
  "system_fingerprint": null
}
```


You can also consume the Ollama's route
```
curl -s -X POST \
  --url http://$DATA_PLANE_LB/ollama-route \
  --header 'Content-Type: application/json' \
  --data '{
     "messages": [
       {
         "role": "user",
         "content": "what is pi?"
       }
     ]
   }' | jq
```


##### AI Proxy configuration parameters

The **AI Proxy** plugin is responsible for a variety of topics. For example:
* Request and response formats appropriate for the configured **provider** and **route_type** settings. **provider** can be set as **anthropic**, **azure**, **bedrock**, **cohere**, **gemini**, **huggingface**, **llama2**, **mistral** or **openai**.
* The **route_type** AI Proxy configuration parameter defines which kind of request the AI Gateway is going to perform. It must be one of:
  * **audio/v1/audio/speech**
  * **audio/v1/audio/transcriptions**
  * **audio/v1/audio/translations**
  * **image/v1/images/edits**
  * **image/v1/images/generations**
  * **llm/v1/assistants**
  * **llm/v1/batches**
  * **llm/v1/chat**
  * **llm/v1/completions**
  * **llm/v1/embeddings**
  * **llm/v1/files**
  * **llm/v1/responses**
  * **preserve**
  * **realtime/v1/realtime**
* Authentication on behalf of the Kong API consumer.
* Decorating the request with parameters from the **config.model.options** block, appropriate for the chosen provider. For our case, we tell the temperature we are going to use.


### Define the model to be consume when sending the request

As you may have noticed our **AI Proxy** plugin defines the model it should consume. That is can be done for individual requests, if required. Change the **ai-proxy.yaml** file, removing the model's name parameter and apply the declaration again:

```
cat > ai-proxy.yaml << 'EOF'
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
          options:
            temperature: 1.0
EOF
```


```
deck gateway reset --konnect-control-plane-name kong-workshop --konnect-token $PAT -f
deck gateway sync --konnect-token $PAT ai-proxy.yaml
```


Send the request specifing the model:

```
curl -i -X POST \
  --url $DATA_PLANE_LB/openai-route \
  --header 'Content-Type: application/json' \
  --data '{
     "messages": [
       {
         "role": "user",
         "content": "what is pi?"
       }
     ],
     "model": "gpt-5"
   }'
```

or 

```
curl -i -X POST \
  --url $DATA_PLANE_LB/openai-route \
  --header 'Content-Type: application/json' \
  --data '{
     "messages": [
       {
         "role": "user",
         "content": "what is pi?"
       }
     ],
     "model": "gpt-4"
   }'
```

Note the Kong AI Proxy plugin adds a new **X-Kong-LLM-Model** header with the model we consumer: ``openai/gpt-5`` or ``openai/gpt-4``


### Streaming

Normally, a request is processed and completely buffered by the LLM before being sent back to Kong AI Gateway and then to the caller in a single large JSON block. This process can be time-consuming, depending on the request parameters, and the complexity of the request sent to the LLM model. To avoid making the user wait for their chat response with a loading animation, most models can stream each word (or sets of words and tokens) back to the client. This allows the chat response to be rendered in real time.

The ``config`` AI Proxy configuration section has a **response_streaming** parameter to define the response streaming. By default is set as ``allow`` but it can be set with ``deny`` or ``always``.

As an example, if you send the same request with the **stream** parameter as ``true`` you should see a response like this:

```
curl -X POST \
  --url $DATA_PLANE_LB/openai-route \
  --header 'Content-Type: application/json' \
  --data '{
     "messages": [
       {
         "role": "user",
         "content": "what is pi?"
       }
     ],
     "model": "gpt-4",
     "stream": true
   }'
```

```
data: {"id":"chatcmpl-C3jmyBQgTgsLd421Wg8fBhM0xkOiK","object":"chat.completion.chunk","created":1755007032,"model":"gpt-4-0613","service_tier":"default","system_fingerprint":null,"choices":[{"index":0,"delta":{"role":"assistant","content":"","refusal":null},"logprobs":null,"finish_reason":null}],"obfuscation":"D5jIQAiER0kD2"}

data: {"id":"chatcmpl-C3jmyBQgTgsLd421Wg8fBhM0xkOiK","object":"chat.completion.chunk","created":1755007032,"model":"gpt-4-0613","service_tier":"default","system_fingerprint":null,"choices":[{"index":0,"delta":{"content":"Pi"},"logprobs":null,"finish_reason":null}],"obfuscation":"3S9RmT4NS9k3b"}

data: {"id":"chatcmpl-C3jmyBQgTgsLd421Wg8fBhM0xkOiK","object":"chat.completion.chunk","created":1755007032,"model":"gpt-4-0613","service_tier":"default","system_fingerprint":null,"choices":[{"index":0,"delta":{"content":" ("},"logprobs":null,"finish_reason":null}],"obfuscation":"3ARtgUA4COqRA"}

data: {"id":"chatcmpl-C3jmyBQgTgsLd421Wg8fBhM0xkOiK","object":"chat.completion.chunk","created":1755007032,"model":"gpt-4-0613","service_tier":"default","system_fingerprint":null,"choices":[{"index":0,"delta":{"content":"π"},"logprobs":null,"finish_reason":null}],"obfuscation":"IS99TImGO4SoLp"}

data: {"id":"chatcmpl-C3jmyBQgTgsLd421Wg8fBhM0xkOiK","object":"chat.completion.chunk","created":1755007032,"model":"gpt-4-0613","service_tier":"default","system_fingerprint":null,"choices":[{"index":0,"delta":{"content":")"},"logprobs":null,"finish_reason":null}],"obfuscation":"8jpC3eE7bQvh7b"}

...

data: {"id":"chatcmpl-C3jmyBQgTgsLd421Wg8fBhM0xkOiK","object":"chat.completion.chunk","created":1755007032,"model":"gpt-4-0613","service_tier":"default","system_fingerprint":null,"choices":[{"index":0,"delta":{"content":"."},"logprobs":null,"finish_reason":null}],"obfuscation":"YHL01GZcTNF1Wh"}

data: {"id":"chatcmpl-C3jmyBQgTgsLd421Wg8fBhM0xkOiK","object":"chat.completion.chunk","created":1755007032,"model":"gpt-4-0613","service_tier":"default","system_fingerprint":null,"choices":[{"index":0,"delta":{},"logprobs":null,"finish_reason":"stop"}],"obfuscation":"vf2t9C6t3"}

data: [DONE]
```




### Extra Model Options

The [Kong AI Proxy](https://developer.konghq.com/plugins/ai-proxy/reference/) provides other configuration options. For example:

* **max_tokens**: defines the **max_tokens**, if using chat or completion models.
* **temperature**: it is a number between 0 and 5 and it defines the matching temperature, if using chat or completion models.
* **top_p**: a number between 0 and 1 defining the top-p probability mass, if supported.
* **top_k**: an integer between 0 and 500 defining the top-k most likely tokens, if supported.




Kong-gratulations! have now reached the end of this module by caching API responses. You can now click **Next** to proceed with the next module.
