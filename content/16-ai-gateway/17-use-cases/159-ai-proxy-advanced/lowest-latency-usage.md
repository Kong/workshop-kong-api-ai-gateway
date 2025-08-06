---
title : "Lowest-Latency and Lowest-Usage"
weight : 4
---


#### Lowest Latency policy

The lowest-latency algorithm is based on the response time for each model. It distributes requests to models with the lowest response time.

Create a file with the following declaration:

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
        balancer:
          algorithm: lowest-latency
          latency_strategy: e2e
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
        - model:
            provider: bedrock
            name: "us.meta.llama3-3-70b-instruct-v1:0"
            options:
              bedrock:
                aws_region: us-west-2
          route_type: "llm/v1/chat"
          auth:
            allow_override: false
EOF
:::

Apply the declaration with decK:

:::code{showCopyAction=true showLineNumbers=false language=shell}
deck gateway reset --konnect-control-plane-name kong-aws --konnect-token $PAT -f
deck gateway sync --konnect-token $PAT ai-proxy-advanced.yaml
:::

Test the Route again.

:::code{showCopyAction=true showLineNumbers=false language=shell}
curl -s -X POST \
  --url $DATA_PLANE_LB/bedrock-route \
  --header 'Content-Type: application/json' \
  --data '{
     "messages": [
       {
         "role": "user",
         "content": "Who is considered the greatest Polish writer?"
       }
     ]
   }' | jq
:::

#### Lowest Usage policy

The lowest-usage algorithm in **AI Proxy Advanced** is based on the volume of usage for each model. It balances the load by distributing requests to models with the lowest usage, measured by factors such as prompt token counts, response token counts, or other resource metrics.

Replace the declaration:


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
        balancer:
          algorithm: lowest-usage
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
        - model:
            provider: bedrock
            name: "us.meta.llama3-3-70b-instruct-v1:0"
            options:
              bedrock:
                aws_region: us-west-2
          route_type: "llm/v1/chat"
          auth:
            allow_override: false
EOF
:::




Apply the declaration:

:::code{showCopyAction=true showLineNumbers=false language=shell}
deck gateway reset --konnect-control-plane-name kong-aws --konnect-token $PAT -f
deck gateway sync --konnect-token $PAT ai-proxy-advanced.yaml
:::


And test the Route again.

:::code{showCopyAction=true showLineNumbers=false language=shell}
curl -s -X POST \
  --url $DATA_PLANE_LB/bedrock-route \
  --header 'Content-Type: application/json' \
  --data '{
     "messages": [
       {
         "role": "user",
         "content": "Who is considered the greatest Polish writer?"
       }
     ]
   }' | jq
:::