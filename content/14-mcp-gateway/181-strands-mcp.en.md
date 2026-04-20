---
title : "Strands Agent and MCP"
weight : 141
---


## Strands Agent

One nice approach to understand a new techonology component is to outline the problem it addresses. In order to see it, let's create a basic AI Agent written in [Strands](https://strandsagents.com/).

Strands Agents, the Python-based framework for building agents, was introduced by AWS in May, 2025. Strands makes the integration with tools, GenAI models and services straightforward by providing a consistent way for agents to interact with external systems. It simplifies how developers orchestrate tools, gather context, and orchestrate reasoning, turning complex multi-service workflows into maintainable, event-driven agent logic.


#### Python setup

We are going to run a basic Strands Agent, written in Python, to better understand the purpose of MCP. Make sure you have your **DECK_ANTHROPIC_API_KEY** env variable set.

```
uv init kong-workshop-strands
uv venv
source .venv/bin/activate
uv pip install 'strands-agents[openai]==1.23.0'
uv pip install aiohttp
cd kong-workshop-strands
```



## Kong AI Proxy Advanced plugin

We have to configure Kong AI Gateway to consume Bedrock

```
cat > ai-proxy-advanced.yaml << 'EOF'
_format_version: "3.0"
_info:
  select_tags:
  - anthropic
_konnect:
  control_plane_name: kong-workshop
services:
- name: ai-proxy-advanced-service
  host: localhost
  port: 32000
  routes:
  - name: anthropic-route
    paths:
    - /anthropic-route
    plugins:
    - name: ai-proxy-advanced
      instance_name: ai-proxy-advanced-anthropic
      enabled: true
      config:
        targets:
        - model:
            provider: anthropic
            name: claude-sonnet-4-6
            options:
              anthropic_version: '2023-06-01'
              max_tokens: 512
              temperature: 1.0
          route_type: "llm/v1/chat"
          auth:
            header_name: x-api-key
            header_value: ${{ env "DECK_ANTHROPIC_API_KEY" }}
EOF
```

Apply the declaration with decK:

```
deck gateway reset --konnect-control-plane-name kong-workshop --konnect-token $PAT -f
deck gateway sync --konnect-control-plane-name kong-workshop --konnect-token $PAT ai-proxy-advanced.yaml
```



##### Consume the Kong Route

```
curl -s -X POST \
  --url $DATA_PLANE_LB/anthropic-route \
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
cat > kong-workshop-agent.py << 'EOF'
from strands import Agent
from strands.models.openai import OpenAIModel
from strands.tools import tool


import os



@tool
def dummy_tool():
    return null



data_plane_lb = os.getenv("DATA_PLANE_LB");

kong_dp = f"http://{data_plane_lb}"
kong_dp_route = f"http://{data_plane_lb}/anthropic-route"

print("kong_dp_route")
print(kong_dp_route)


openai_model = OpenAIModel(
  client_args={
      "base_url": kong_dp_route,
      "api_key": "dummy",
  },
  model_id="claude-sonnet-4-6",
  # max_tokens=1024,
)


agent = Agent(model=openai_model, tools=[dummy_tool])
agent("Who is Aldous Huxley?")
EOF
```



The prompt is very simple, so the LLM will be able to respond it. However if you change the code and ask something like **"List all orders made by Alice Johnson"** you'll see a different behaviour.

```
cat > kong-workshop-agent.py << 'EOF'
from strands import Agent
from strands.models.openai import OpenAIModel
from strands.tools import tool


import os



@tool
def dummy_tool():
    return null



data_plane_lb = os.getenv("DATA_PLANE_LB");

kong_dp = f"http://{data_plane_lb}"
kong_dp_route = f"http://{data_plane_lb}/anthropic-route"

print("kong_dp_route")
print(kong_dp_route)


openai_model = OpenAIModel(
  client_args={
      "base_url": kong_dp_route,
      "api_key": "dummy",
  },
  model_id="claude-sonnet-4-6",
)


agent = Agent(model=openai_model, tools=[dummy_tool])
agent("List all orders made by Alice Johnson")
EOF
```


#### Execute the code

```
python3 kong-workshop-agent.py
```

* Typical response
```
kong_dp_route
http://127.0.0.1/anthropic-route
I'm sorry, but I don't have a tool available to look up or retrieve order information for customers like Alice Johnson. The only tool I have access to is a **dummy tool** that doesn't support querying order data.

To find all orders made by Alice Johnson, I'd suggest:
1. **Checking your Order Management System (OMS)** directly.
2. **Querying your database** using something like:
   sql
   SELECT * FROM orders WHERE customer_name = 'Alice Johnson';
3. **Contacting your support or data team** who may have access to customer order records.

If you can provide me with the right tools or data, I'd be happy to help further!
```


That's one of the main reasons why we should add Tools to our Agent. In fact, LLMs are not able to process prompts like this without setting some context. By context, we mean artifacts like transcripts or documents, presentations or functions so the LLM can respond accordingly. That's the purpose of MCPs: to provide a standardized mechanism for LLMs to access some context.



You can now click **Next** to proceed further.