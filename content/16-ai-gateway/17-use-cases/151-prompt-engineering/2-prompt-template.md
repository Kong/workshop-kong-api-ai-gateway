---
title : "AI Prompt Template"
weight : 2
---

The **AI Prompt Template** plugin lets you provide tuned AI prompts to users. Users only need to fill in the blanks with variable placeholders in the following format: ``{{variable}}``. This lets admins set up templates, which can be then be used by anyone in the organization. It also allows admins to present an LLM as an API in its own right - for example, a bot that can provide software class examples and/or suggestions.

This plugin also sanitizes string inputs to ensure that JSON control characters are escaped, preventing arbitrary prompt injection.

When calling a template, simply replace the messages (``llm/v1/chat``) or prompt (``llm/v1/completions``) with a template reference, in the following format: ``{template://TEMPLATE_NAME}``

Here's an example of template definition:

```
cat > ai-prompt-template.yaml << 'EOF'
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
    - name: ai-prompt-template
      instance_name: ai-prompt-template-openai
      enabled: true
      config:
        allow_untemplated_requests: true
        templates:
        - name: template1
          template: |-
            {
                "messages": [
                    {
                        "role": "user",
                        "content": "Explain to me what {{thing}} is."
                    }
                ]
            }
EOF
```


Apply the declaration with decK:
```
deck gateway reset --konnect-control-plane-name kong-workshop --konnect-token $PAT -f
deck gateway sync --konnect-token $PAT ai-prompt-template.yaml
```

Now, send a request referring the template:

```
curl -s -X POST \
  --url $DATA_PLANE_LB/openai-route \
  --header 'Content-Type: application/json' \
  --data '{
     "messages": "{template://template1}",
     "properties": {
       "thing": "niilism"
     }
  }' | jq
```







Kong-gratulations! have now reached the end of this module by authenticating your API requests with AWS Cognito. You can now click **Next** to proceed with the next module.