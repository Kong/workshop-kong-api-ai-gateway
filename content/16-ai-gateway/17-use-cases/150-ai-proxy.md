---
title : "AI Proxy plugin"
weight : 150
---

The [AI Proxy plugin](https://docs.konghq.com/hub/kong-inc/ai-proxy/configuration/) is the fundamental AI Gateway component. It lets you transform and proxy requests to a number of AI providers and models. The plugin accepts requests in one of a few defined and standardised formats, translates them to the configured target format, and then transforms the response back into a standard format.

![AI Proxy Bedrock](/static/images/ai_proxy.png)


The following table describes which providers and requests the AI Proxy plugin supports:

![providers_support](/static/images/providers_support.png)


## Getting Started with Amazon Bedrock and Kong AI Gateway

We are going to get started with a simple configuration. The following decK declaration enables the **AI Proxy** plugin to the Kong Gateway Service, to send requests to Amazon Bedrock and consume the **amazon.nova-micro-v1:0** Amazon FM with **chat** LLM requests.

For Amazon Bedrock, the **allow_override** parameter should be set to ``false``, saying the the authorization header or parameter can not be overridden by requests.

Update your **ai-gateway.yaml** file with that:

:::code{showCopyAction=true showLineNumbers=false language=shell}
cat > ai-proxy.yaml << 'EOF'
_format_version: "3.0"
_konnect:
  control_plane_name: kong-aws
_info:
  select_tags:
  - bedrock
services:
- name: service1
  host: localhost
  port: 32000
  routes:
  - name: route1
    paths:
    - /bedrock-route
    plugins:
    - name: ai-proxy
      instance_name: "ai-proxy-bedrock"
      config:
        auth:
          param_name: "allow_override"
          param_value: "false"
          param_location: "body"
        route_type: "llm/v1/chat"
        model:
          provider: "bedrock"
          name: "us.amazon.nova-micro-v1:0"
          options:
            bedrock:
              aws_region: "us-west-2"
EOF
:::


Apply the declaration with decK:
:::code{showCopyAction=true showLineNumbers=false language=shell}
deck gateway reset --konnect-control-plane-name kong-aws --konnect-token $PAT -f
deck gateway sync --konnect-token $PAT ai-proxy.yaml
:::


### OpenAI API

Kong AI Gateway provides one API to access all of the LLMs it supports. To accomplish this, Kong AI Gateway has standardized on the [OpenAI API specification](https://platform.openai.com/docs/api-reference). This will help developers to onboard more quickly by providing them with an API specification that they're already familiar with. You can start using LLMs behind the AI Gateway simply by redirecting your requests to a URL that points to a route of the AI Gateway.


### Send a request to Kong AI Gateway
Now, send a request to Kong AI Gateway following the [OpenAI API Chat](https://platform.openai.com/docs/api-reference/chat) specification as a reference:

:::code{showCopyAction=true showLineNumbers=false language=shell}
curl -s -X POST \
  --url $DATA_PLANE_LB/bedrock-route \
  --header 'Content-Type: application/json' \
  --data '{
     "messages": [
       {
         "role": "user",
         "content": "what is pi?"
       }
     ]
   }' | jq
:::

**Expected Output**

Note the response also complies to the OpenAI API spec:

```
{
  "object": "chat.completion",
  "model": "us.amazon.nova-micro-v1:0",
  "usage": {
    "prompt_tokens": 4,
    "total_tokens": 187,
    "completion_tokens": 183
  },
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "Pi (π) is a mathematical constant that represents the ratio of a circle's circumference to its diameter. It is an irrational number, which means it cannot be expressed exactly as a simple fraction and its decimal representation goes on infinitely without repeating. The value of pi is approximately 3.14159, but it is commonly rounded to 3.14 for simpler calculations.\n\nPi is used in various fields of mathematics and science, especially in geometry and trigonometry, to solve problems related to circles, spheres, and other circular or spherical shapes. Its importance spans across numerous applications, from engineering and physics to computer science and statistics.\n\nIn mathematical notation, pi is represented by the Greek letter π, and it has a numerical value of:\n\n\\[ \\pi \\approx 3.141592653589793 \\]\n\n(and so on)."
      },
      "index": 0,
      "finish_reason": "stop"
    }
  ]
}
```

##### AI Proxy configuration parameters

The **AI Proxy** plugin is responsible for a variety of topics. For example:
* Request and response formats appropriate for the configured **provider** and **route_type** settings.
* The **route_type** AI Proxy configuration parameter defines which kind of request the AI Gateway is going to perform. It must be one of: **llm/v1/chat**, **llm/v1/completions** or **preserve**. Set to **preserve** to pass through without transformation.
* Authentication on behalf of the Kong API consumer.
* Decorating the request with parameters from the **config.model.options** block, appropriate for the chosen provider. For our case, we tell which AWS region we want to send requests to.


### Define the model to be consume when sending the request

As you may have noticed our **AI Proxy** plugin defines the Bedrock model it should consume. That is can be done for individual requests, if required. Change the **ai-gateway.yaml** file, removing the model's name parameter and apply the declaration again:

:::code{showCopyAction=true showLineNumbers=false language=shell}
cat > ai-proxy.yaml << 'EOF'
_format_version: "3.0"
_konnect:
  control_plane_name: kong-aws
_info:
  select_tags:
  - bedrock
services:
- name: service1
  host: localhost
  port: 32000
  routes:
  - name: route1
    paths:
    - /bedrock-route
    plugins:
    - name: ai-proxy
      instance_name: "ai-proxy-bedrock"
      config:
        auth:
          param_name: "allow_override"
          param_value: "false"
          param_location: "body"
        route_type: "llm/v1/chat"
        model:
          provider: "bedrock"
          options:
            bedrock:
              aws_region: "us-west-2"
EOF
:::


:::code{showCopyAction=true showLineNumbers=false language=shell}
deck gateway reset --konnect-control-plane-name kong-aws --konnect-token $PAT -f
deck gateway sync --konnect-token $PAT ai-proxy.yaml
:::


Send the request specifing the model:

:::code{showCopyAction=true showLineNumbers=false language=shell}
curl -i -X POST \
  --url $DATA_PLANE_LB/bedrock-route \
  --header 'Content-Type: application/json' \
  --data '{
     "messages": [
       {
         "role": "user",
         "content": "what is pi?"
       }
     ],
     "model": "us.meta.llama3-3-70b-instruct-v1:0"
   }'
:::

or 

:::code{showCopyAction=true showLineNumbers=false language=shell}
curl -i -X POST \
  --url $DATA_PLANE_LB/bedrock-route \
  --header 'Content-Type: application/json' \
  --data '{
     "messages": [
       {
         "role": "user",
         "content": "what is pi?"
       }
     ],
     "model": "us.amazon.nova-lite-v1:0"
   }'
:::

Note the Kong AI Proxy plugin adds a new **X-Kong-LLM-Model** header with the model we consumer: **bedrock/us.meta.llama3-3-70b-instruct-v1:0** or **bedrock/us.amazon.nova-lite-v1:0**


### Streaming

Normally, a request is processed and completely buffered by the LLM before being sent back to Kong AI Gateway and then to the caller in a single large JSON block. This process can be time-consuming, depending on the request parameters, and the complexity of the request sent to the LLM model. To avoid making the user wait for their chat response with a loading animation, most models can stream each word (or sets of words and tokens) back to the client. This allows the chat response to be rendered in real time.

The ``config`` AI Proxy configuration section has a **response_streaming** parameter to define the response streaming. By default is set as ``allow`` but it can be set with ``deny`` or ``always``.

As an example, if you send the same request with the **stream** parameter as ``true`` you should see a response like this:

:::code{showCopyAction=true showLineNumbers=false language=shell}
curl -X POST \
  --url $DATA_PLANE_LB/bedrock-route \
  --header 'Content-Type: application/json' \
  --data '{
     "messages": [
       {
         "role": "user",
         "content": "what is pi?"
       }
     ],
     "model": "us.amazon.nova-lite-v1:0",
     "stream": true
   }'
:::

```
data: {"object":"chat.completion.chunk","choices":[{"logprobs":null,"delta":{"content":"","role":"assistant"},"index":0}],"system_fingerprint":null}

data: {"object":"chat.completion.chunk","choices":[{"logprobs":null,"delta":{"content":"Pi"},"index":0}],"system_fingerprint":null}

data: {"object":"chat.completion.chunk","choices":[{"logprobs":null,"delta":{"content":" (π"},"index":0}],"system_fingerprint":null}

data: {"object":"chat.completion.chunk","choices":[{"logprobs":null,"delta":{"content":") is a mathematical"},"index":0}],"system_fingerprint":null}

data: {"object":"chat.completion.chunk","choices":[{"logprobs":null,"delta":{"content":" constant that"},"index":0}],"system_fingerprint":null}

...

data: {"object":"chat.completion.chunk","choices":[{"logprobs":null,"delta":{"content":""},"index":0}],"system_fingerprint":null}

data: {"choices":[{"logprobs":null,"finish_reason":"stop","delta":{},"index":0}],"object":"chat.completion.chunk"}

data: [DONE]
```




### Extra Model Options

The [Kong AI Proxy](https://docs.konghq.com/hub/kong-inc/ai-proxy/configuration/) provides other configuration options. For example:

* **max_tokens**: defines the max_tokens, if using chat or completion models. By default, it is set as 256.

Also, there are options to [influence response generation with inference parameters](https://docs.aws.amazon.com/bedrock/latest/userguide/inference-parameters.html):
* **temperature**: it is a number between 0 and 5 and it defines the matching temperature, if using chat or completion models.
* **top_p**: a number between 0 and 1 defining the top-p probability mass, if supported.
* **top_k**: an integer between 0 and 500 defining the top-k most likely tokens, if supported.










Kong-gratulations! have now reached the end of this module by caching API responses. You can now click **Next** to proceed with the next module.
