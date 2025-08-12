---
title : "AI Prompt Decorator"
weight : 1
---

The **AI Prompt Decorator** plugin adds an array of ``llm/v1/chat`` messages to either the start or end of an LLM consumer’s chat history. This allows you to pre-engineer complex prompts, or steer (and guard) prompts in such a way that the modification to the consumer’s LLM message is completely transparent.

You can use this plugin to pre-set a system prompt, set up specific prompt history, add words and phrases, or otherwise have more control over how an LLM service is used when called via Kong Gateway.


```
cat > ai-prompt-decorator.yaml << 'EOF'
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
    - name: ai-prompt-decorator
      instance_name: ai-prompt-decorator-openai
      config:
        prompts:
          prepend:
          - role: system
            content: "You will always respond in the Portuguese (Brazil) language."
EOF
```

Apply the declaration with decK:
```
deck gateway reset --konnect-control-plane-name kong-workshop --konnect-token $PAT -f
deck gateway sync --konnect-token $PAT ai-prompt-decorator.yaml
```


Send a request now:

```
curl -s -X POST \
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
   }' | jq
```




You can now click **Next** to proceed further.


