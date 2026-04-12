---
title : "Configure Kong AI Gateway"
weight : 191
---


### Configure Kong AI Gateway with Anthropic Claude Sonnet 4 model, Mocking Services and MCP Tools

Make sure you Kong AI Gateway with the right configuration including Anthropic Model, Mocking Services and MCP Tools. This **decK** declaration is quite similar to the one you used before. The only difference is that the new one has the AI logging configuration set.

```
deck gateway reset --konnect-control-plane-name kong-aws --konnect-token $PAT -f
deck gateway sync --konnect-control-plane-name kong-aws --konnect-token $PAT marketplace_mcp_logging.yaml
```


### Configure Kong AI Gateway to consume Amazon Bedrock

Configure Kong AI Gateway to consume the **Claude Opus 4.6** model

```
cat > claude-code.yaml << 'EOF'
_format_version: "3.0"
_info:
  select_tags:
  - claude-code
services:
- name: claude-code-service
  url: http://localhost:32000
  routes:
  - name: claude-code-route
    paths:
    - "/anthropic"
  plugins:
    - name: ai-proxy-advanced
      instance_name: ai-proxy-advanced-claude-code
      enabled: true
      config:
        llm_format: anthropic
        targets:
        - model:
            provider: anthropic
            name: claude-opus-4-6
            options:
              anthropic_version: '2023-06-01'
              input_cost: 2000
              output_cost: 2500
          route_type: llm/v1/chat
          auth:
            header_name: x-api-key
            header_value: ${{ env "DECK_ANTHROPIC_API_KEY" }}
          logging:
            log_statistics: true
            log_payloads: false
        max_request_body_size: 262144
EOF
```


Apply the declaration with decK:

```
deck gateway reset --konnect-control-plane-name kong-workshop --select-tag claude-code --konnect-token $PAT -f
deck gateway sync --konnect-control-plane-name kong-workshop --konnect-token $PAT claude-code.yaml
```


### Check Kong Gateway Service and Kong Routes

After submitting the declarations you should have the following Kong Gateway Services:

![Claude Code Kong Services](/static/images/claude_code_kong_services.png)

And the following Kong Routes:

![Claude Code Kong Routes](/static/images/claude_code_kong_routes.png)






You can now click **Next** to proceed further.