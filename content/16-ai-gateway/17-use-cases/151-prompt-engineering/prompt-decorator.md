---
title : "AI Prompt Decorator plugin"
weight : 1
---

The **AI Prompt Decorator** plugin adds an array of ``llm/v1/chat`` messages to either the start or end of an LLM consumer’s chat history. This allows you to pre-engineer complex prompts, or steer (and guard) prompts in such a way that the modification to the consumer’s LLM message is completely transparent.

You can use this plugin to pre-set a system prompt, set up specific prompt history, add words and phrases, or otherwise have more control over how an LLM service is used when called via Kong Gateway.


:::code{showCopyAction=true showLineNumbers=false language=shell}
cat > ai-prompt-decorator.yaml << 'EOF'
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
    - name: ai-prompt-decorator
      instance_name: ai-prompt-decorator-bedrock
      config:
        prompts:
          prepend:
          - role: system
            content: "You will always respond in the Portuguese (Brazil) language."
EOF
:::

Apply the declaration with decK:
:::code{showCopyAction=true showLineNumbers=false language=shell}
deck gateway reset --konnect-control-plane-name kong-aws --konnect-token $PAT -f
deck gateway sync --konnect-token $PAT ai-prompt-decorator.yaml
:::


Send a request now:

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
     ],
     "model": "us.amazon.nova-lite-v1:0"
   }' | jq
:::




You can now click **Next** to proceed further.


