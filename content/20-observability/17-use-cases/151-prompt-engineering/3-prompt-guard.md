---
title : "AI Prompt Guard"
weight : 3
---

The **AI Prompt Guard** plugin lets you to configure a series of PCRE-compatible regular expressions as allow or deny lists, to guard against misuse of ``llm/v1/chat`` or ``llm/v1/completions`` requests.

You can use this plugin to allow or block specific prompts, words, phrases, or otherwise have more control over how an LLM service is used when called via Kong Gateway. It does this by scanning all chat messages (where the role is user) for the specific expressions set. You can use a combination of allow and deny rules to preserve integrity and compliance when serving an LLM service using Kong Gateway.

* For ``llm/v1/chat`` type models: You can optionally configure the plugin to ignore existing chat history, wherein it will only scan the trailing user message.
* For ``llm/v1/completions`` type models: There is only one prompt field, thus the whole prompt is scanned on every request.

The plugin matches lists of regular expressions to requests through AI Proxy. The matching behavior is as follows:
* If any ``deny`` expressions are set, and the request matches any regex pattern in the deny list, the caller receives a 400 response.
* If any ``allow`` expressions are set, but the request matches none of the allowed expressions, the caller also receives a 400 response.
* If any ``allow`` expressions are set, and the request matches one of the allow expressions, the request passes through to the LLM.
* If there are both ``deny`` and ``allow`` expressions set, the ``deny`` condition takes precedence over ``allow``. Any request that matches an entry in the ``deny`` list will return a 400 response, even if it also matches an expression in the ``allow`` list. If the request does not match an expression in the ``deny`` list, then it must match an expression in the ``allow`` list to be passed through to the LLM

Here's an example to allow only valid credit cards numbers:

```
cat > ai-prompt-guard.yaml << 'EOF'
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
    - name: ai-prompt-guard
      instance_name: ai-prompt-guard-openai
      enabled: true
      config:
        allow_all_conversation_history: true
        allow_patterns: 
        - ".*\\\"card\\\".*\\\"4[0-9]{3}\\*{12}\\\""
EOF
```

Apply the declaration with decK:
```
deck gateway reset --konnect-control-plane-name kong-workshop --konnect-token $PAT -f
deck gateway sync --konnect-token $PAT ai-prompt-guard.yaml
```


Send a request with a valid credit card pattern:

```
curl -s -X POST \
  --url $DATA_PLANE_LB/openai-route \
  --header 'Content-Type: application/json' \
  --data-raw '{
     "messages": [
       {
         "role": "user",
         "content": "Validate this card: {\"card\": \"4111************\", \"cvv\": \"000\"}"
       }
     ]
   }' | jq '.'
```




Now, send a non-valid number:

```
curl -s -X POST \
  --url $DATA_PLANE_LB/openai-route \
  --header 'Content-Type: application/json' \
  --data-raw '{
     "messages": [
       {
         "role": "user",
         "content": "Validate this card: {\"card\": \"4111xyz************\", \"cvv\": \"000\"}"
       }
     ]
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