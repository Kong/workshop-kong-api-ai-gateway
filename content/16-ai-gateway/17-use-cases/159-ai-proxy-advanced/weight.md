---
title : "Weight"
weight : 3
---

Now, let's redirect 80% of the request to Amazon's Nova with a weight based policy:

:::code{showCopyAction=true showLineNumbers=false language=shell}
cat > ai-proxy-advanced.yaml << 'EOF'
_format_version: "3.0"
_info:
  select_tags:
  - bedrock
_konnect:
  control_plane_name: kong-aws
services:
- name: ai-proxy-advanced-service
  host: localhost
  port: 32000
  routes:
  - name: route1
    paths:
    - /bedrock-route
    plugins:
    - name: ai-proxy-advanced
      instance_name: ai-proxy-advanced-bedrock
      config:
        targets:
        - model:
            provider: bedrock
            name: "us.amazon.nova-micro-v1:0"
            options:
              bedrock:
                aws_region: us-west-2
          route_type: "llm/v1/chat"
          auth:
            allow_override: false
          weight: 80
        - model:
            provider: bedrock
            name: "us.meta.llama3-3-70b-instruct-v1:0"
            options:
              bedrock:
                aws_region: us-west-2
          route_type: "llm/v1/chat"
          auth:
            allow_override: false
          weight: 20
EOF
:::


Apply the declaration with decK:
:::code{showCopyAction=true showLineNumbers=false language=shell}
deck gateway reset --konnect-control-plane-name kong-aws --konnect-token $PAT -f
deck gateway sync --konnect-token $PAT ai-proxy-advanced.yaml
:::
