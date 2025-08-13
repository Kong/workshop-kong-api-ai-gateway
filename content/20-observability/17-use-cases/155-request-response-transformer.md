---
title : "AI Request and Response Transfomers"
weight : 155
---

The **AI Request Transformer** and **AI Response Transformer** plugins integrate with the LLM on Amazon Bedrock, enabling introspection and transformation of the request's body before proxying it to the Upstream Service and prior to forwarding the response to the client.

The plugins support ``llm/v1/chat`` style requests for all of the same providers as the AI Proxy plugin. It also use all of the same configuration and tuning parameters as the **AI Proxy** plugin, under the ``config.llm`` block.

The **AI Request Transformer** plugin runs before all of the **AI Prompt** plugins and the **AI Proxy** plugin, allowing it to also introspect LLM requests against the same, or a different, LLM. On the other hand, the **AI Response Transformer** plugin runs after the **AI Proxy** plugin, and after proxying to the Upstream Service, allowing it to also introspect LLM responses against the same, or a different, LLM service.

![request_response_tranformer_plugins](/static/images/request_response_tranformer_plugins.png)

The diagram shows the journey of a consumer’s request through Kong Gateway to the backend service, where it is transformed by both an AI LLM service and Kong’s **AI Request Transformer** and the **AI Response Transformer** plugins.

For each plugin the configuration and usage processes are:
* The Kong Gateway admin sets up an llm: configuration block, following the same configuration format as the AI Proxy plugin, and the same driver capabilities.
* The Kong Gateway admin sets up a prompt for the request introspection. The prompt becomes the system message in the LLM chat request, and prepares the LLM with transformation instructions for the incoming user request body (for the **AI Request Transformer** plugin) and for the returning upstream response body (for the **AI Response Transformer** plugin)
* The user makes an HTTP(S) call.
* Before proxying the user’s request to the backend, Kong Gateway sets the entire request body as the user message in the LLM chat request, and then sends it to the configured LLM service.
* After receiving the response from the backend, Kong Gateway sets the entire response body as the user message in the LLM chat request, then sends it to the configured LLM service.
* The LLM service returns a response ``assistant`` message, which is subsequently set as the upstream request body.

The following example is going to apply the plugins to transform both request and reponse when consuming the **httpbin** Upstream Service.


Now, configure both plugins. Keep in mind that the plugins are totally independent from each other so, the configuration depends on your use case.

```
cat > ai-request-response-tranformer.yaml << 'EOF'
_format_version: "3.0"
_konnect:
  control_plane_name: kong-workshop
_info:
  select_tags:
  - llm
services:
- name: httpbin-service
  host: httpbin.kong.svc.cluster.local
  port: 8000
  routes:
  - name: httpbin-route
    paths:
    - /httpbin-route
    plugins:
    - name: ai-request-transformer
      instance_name: ai-request-transformer
      enabled: true
      config:
        prompt: In my JSON message, anywhere there is a JSON tag for a "city", also add a "country" tag with the name of the country in which the city resides. Return me only the JSON message, no extra text."
        llm:
          route_type: llm/v1/chat
          auth:
            header_name: Authorization
            header_value: Bearer ${{ env "DECK_OPENAI_API_KEY" }}
          model:
            provider: openai
            name: gpt-4.1
            options:
              temperature: 1.0
    - name: ai-response-transformer
      instance_name: ai-response-transformer
      enabled: true
      config:
        prompt: For any city name, add its current temperature, in brackets next to it. Reply with the JSON result only.
        llm:
          route_type: llm/v1/chat
          auth:
            header_name: Authorization
            header_value: Bearer ${{ env "DECK_OPENAI_API_KEY" }}
          model:
            provider: openai
            name: gpt-4.1
            options:
              temperature: 1.0
EOF
```

Apply the declaration with decK:
```
deck gateway reset --konnect-control-plane-name kong-workshop --konnect-token $PAT -f
deck gateway sync --konnect-token $PAT ai-request-response-tranformer.yaml
```


```
curl -s -X POST \
  --url $DATA_PLANE_LB/httpbin-route/post \
  --header 'Content-Type: application/json' \
  --data '{
   "user": {
     "name": "Kong User",
     "city": "Tokyo"
   }
}' | jq
```

* Expected output

```
{
  "user": {
    "name": "Kong User",
    "city": "Tokyo [12°C]",
    "country": "Japan"
  }
}
```

Kong-gratulations! have now reached the end of this module by using Kong Gateway to invoke a AWS Lambda function. You can now click **Next** to proceed with the next chapter.