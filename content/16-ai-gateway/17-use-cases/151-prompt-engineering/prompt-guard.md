---
title : "AI Prompt Guard plugin"
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

:::code{showCopyAction=true showLineNumbers=false language=shell}
cat > ai-prompt-guard.yaml << 'EOF'
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
    - name: ai-prompt-guard
      instance_name: ai-prompt-guard-bedrock
      enabled: true
      config:
        allow_all_conversation_history: true
        allow_patterns: 
        - ".*\\\"card\\\".*\\\"4[0-9]{3}\\*{12}\\\""
EOF
:::

Apply the declaration with decK:
:::code{showCopyAction=true showLineNumbers=false language=shell}
deck gateway reset --konnect-control-plane-name kong-aws --konnect-token $PAT -f
deck gateway sync --konnect-token $PAT ai-prompt-guard.yaml
:::


Send a request with a valid credit card pattern:

:::code{showCopyAction=true showLineNumbers=false language=shell}
curl -s -X POST \
  --url $DATA_PLANE_LB/bedrock-route \
  --header 'Content-Type: application/json' \
  --data-raw '{
     "messages": [
       {
         "role": "user",
         "content": "Validate this card: {\"card\": \"4111************\", \"cvv\": \"000\"}"
       }
     ],
     "model": "us.amazon.nova-lite-v1:0"
   }' | jq '.'
:::




Now, send a non-valid number:

:::code{showCopyAction=true showLineNumbers=false language=shell}
curl -s -X POST \
  --url $DATA_PLANE_LB/bedrock-route \
  --header 'Content-Type: application/json' \
  --data-raw '{
     "messages": [
       {
         "role": "user",
         "content": "Validate this card: {\"card\": \"4111xyz************\", \"cvv\": \"000\"}"
       }
     ],
     "model": "us.amazon.nova-lite-v1:0"
   }' | jq '.'
:::


The expect result is:
```
{
  "error": {
    "message": "bad request"
  }
}
```