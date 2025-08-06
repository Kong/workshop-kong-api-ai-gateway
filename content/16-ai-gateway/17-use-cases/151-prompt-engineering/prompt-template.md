---
title : "AI Prompt Template plugin"
weight : 2
---

The **AI Prompt Template** plugin lets you provide tuned AI prompts to users. Users only need to fill in the blanks with variable placeholders in the following format: ``{{variable}}``. This lets admins set up templates, which can be then be used by anyone in the organization. It also allows admins to present an LLM as an API in its own right - for example, a bot that can provide software class examples and/or suggestions.

This plugin also sanitizes string inputs to ensure that JSON control characters are escaped, preventing arbitrary prompt injection.

When calling a template, simply replace the messages (``llm/v1/chat``) or prompt (``llm/v1/completions``) with a template reference, in the following format: ``{template://TEMPLATE_NAME}``

Here's an example of template definition:

:::code{showCopyAction=true showLineNumbers=false language=shell}
cat > ai-prompt-template.yaml << 'EOF'
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
          name: "us.amazon.nova-lite-v1:0"
          provider: "bedrock"
          options:
            bedrock:
              aws_region: "us-west-2"
    - name: ai-prompt-template
      instance_name: ai-prompt-template-bedrock
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
:::


Apply the declaration with decK:
:::code{showCopyAction=true showLineNumbers=false language=shell}
deck gateway reset --konnect-control-plane-name kong-aws --konnect-token $PAT -f
deck gateway sync --konnect-token $PAT ai-prompt-template.yaml
:::

Now, send a request referring the template:

:::code{showCopyAction=true showLineNumbers=false language=shell}
curl -s -X POST \
  --url $DATA_PLANE_LB/bedrock-route \
  --header 'Content-Type: application/json' \
  --data '{
     "messages": "{template://template1}",
     "properties": {
       "thing": "niilism"
     }
  }' | jq
:::







Kong-gratulations! have now reached the end of this module by authenticating your API requests with AWS Cognito. You can now click **Next** to proceed with the next module.