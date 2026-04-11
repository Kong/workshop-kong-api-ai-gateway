---
title : "Strands Agent and MCP"
weight : 141
---


## Strands Agent

One nice approach to understand a new techonology component is to outline the problem it addresses. In order to see it, let's create a basic AI Agent written in [Strands](https://strandsagents.com/).

Strands Agents, the Python-based framework for building agents, was introduced by AWS in May, 2025. Strands makes the integration with tools, GenAI models and services straightforward by providing a consistent way for agents to interact with external systems. It simplifies how developers orchestrate tools, gather context, and orchestrate reasoning, turning complex multi-service workflows into maintainable, event-driven agent logic.


#### Python setup

We are going to run a basic Strands Agent, written in Python, to better understand the purpose of MCP.

```
uv init kong-aws-strands
uv venv
source .venv/bin/activate
uv pip install 'strands-agents[openai]'
uv pip install aiohttp
```



## Kong AI Proxy Advanced plugin

We have to configure Kong AI Gateway to consume Bedrock

```
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
  - name: bedrock-route
    paths:
    - /bedrock-route
    plugins:
    - name: ai-proxy-advanced
      instance_name: ai-proxy-advanced-bedrock
      enabled: true
      config:
        targets:
        - model:
            provider: bedrock
            name: "us.anthropic.claude-sonnet-4-20250514-v1:0"
            options:
              bedrock:
                aws_region: us-west-2
          route_type: "llm/v1/chat"
          auth:
            allow_override: false
EOF
```

Apply the declaration with decK:

```
deck gateway reset --konnect-control-plane-name kong-aws --konnect-token $PAT -f
deck gateway sync --konnect-control-plane-name kong-aws --konnect-token $PAT ai-proxy-advanced.yaml
```



##### Consume the Kong Route

```
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
```

#### Strands Code
Now, here's a basic Strands Agent consuming Kong AI Gateway:

```
cat > kong-aws-agent.py << 'EOF'
from strands import Agent
from strands.models.openai import OpenAIModel

import os


data_plane_lb = os.getenv("DATA_PLANE_LB");

kong_dp = f"http://{data_plane_lb}"
kong_dp_route = f"http://{data_plane_lb}/bedrock-route"

print("kong_dp_route")
print(kong_dp_route)


openai_model = OpenAIModel(
  client_args={
      "base_url": kong_dp_route,
      "api_key": "dummy"
  },
  model_id="us.anthropic.claude-sonnet-4-20250514-v1:0"
)


agent = Agent(model=openai_model)
agent("Who is Aldous Huxley?")
EOF
```



The prompt is very simple, so the LLM will be able to respond it. However if you change the code and ask something like **"List all orders made by Alice Johnson"** you'll see a different behaviour.

```
cat > kong-aws-agent.py << 'EOF'
from strands import Agent
from strands.models.openai import OpenAIModel

import os


data_plane_lb = os.getenv("DATA_PLANE_LB");

kong_dp = f"http://{data_plane_lb}"
kong_dp_route = f"http://{data_plane_lb}/bedrock-route"

print("kong_dp_route")
print(kong_dp_route)


openai_model = OpenAIModel(
  client_args={
      "base_url": kong_dp_route,
      "api_key": "dummy"
  },
  model_id="us.anthropic.claude-sonnet-4-20250514-v1:0"
)


agent = Agent(model=openai_model)
agent("List all orders made by Alice Johnson")
EOF
```


#### Execute the code

```
python3 kong-aws-agent.py
```

* Typical response
```
kong_dp_route
http://aef50357c38e142b9ad6986d4f828dd5-1505142468.us-west-2.elb.amazonaws.com/bedrock-route
I don't have access to any order database or customer information system, so I cannot provide a list of orders made by Alice Johnson or any other customer. 

To get this information, you would need to:

1. **Check your e-commerce platform** (like Shopify, WooCommerce, Magento, etc.)
2. **Query your customer database** directly
3. **Use your order management system**
4. **Contact your customer service team**

If you're looking to query a database yourself, you might use SQL like:
sql
SELECT * FROM orders 
WHERE customer_name = 'Alice Johnson';


Or if you have a specific platform or system you're working with, I'd be happy to help you figure out how to retrieve that information from your particular setup.
```


That's one of the main reasons why we should add Tools to our Agent. In fact, LLMs are not able to process prompts like this without setting some context. By context, we mean artifacts like transcripts or documents, presentations or functions so the LLM can respond accordingly. That's the purpose of MCPs: to provide a standardized mechanism for LLMs to access some context.



You can now click **Next** to proceed further.