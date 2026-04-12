---
title : "Test the MCP Tools and LLM with a Strands Agent"
weight : 1803
---

Since we have all components in place, we can extend our Strands Agent to take advantage of the MCP Tools

Here's the new code:

```
cat > kong-workshop-agent.py << 'EOF'
from strands import Agent
from strands.models.openai import OpenAIModel
from strands.tools.mcp import MCPClient
from mcp.client.streamable_http import streamablehttp_client
import os


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

streamable_http_mcp_listener_client = MCPClient(lambda: streamablehttp_client(f"{kong_dp}/mcp-listener"))

with streamable_http_mcp_listener_client:
    tools = streamable_http_mcp_listener_client.list_tools_sync()
    for tool in tools:
      print(tool.tool_spec)

    agent = Agent(model=openai_model, tools=tools)
    agent("List all orders made by Alice Johnson")
EOF
```


The main update here is the inclusion the of Serviceless Route we created in the previous step which defines the "/mcp-listener" path.


### Test the API Deployment

If run the code with:

```
python3 kong-workshop-agent.py
```

You should see a response similar to this.

```
kong_dp_route
http://aef50357c38e142b9ad6986d4f828dd5-1505142468.us-west-2.elb.amazonaws.com/bedrock-route
{'inputSchema': {'json': {'type': 'object', 'additionalProperties': False, 'properties': {'query_id': {'description': 'Optional user ID', 'type': 'string'}}}}, 'name': 'marketplace-route-1', 'description': 'Get users'}
{'inputSchema': {'json': {'required': ['query_userid'], 'type': 'object', 'additionalProperties': False, 'properties': {'query_userid': {'type': 'string', 'description': 'User ID to filter orders'}}}}, 'name': 'marketplace-route-2', 'description': 'Get orders for a user'}
I need to get the orders for Alice Johnson. To do this, I'll first need to find Alice Johnson's user ID, then retrieve her orders.
Tool #1: marketplace-route-1
Great! I found Alice Johnson's user ID is "a1b2c3d4". Now I'll get her orders.
Tool #2: marketplace-route-2
Here are all the orders made by Alice Johnson (User ID: a1b2c3d4):

1. **Order ID: ord001** - Sugar (50kg)
2. **Order ID: ord002** - Cleaning Supplies Pack
3. **Order ID: ord003** - Canned Tomatoes (100 cans)

Alice Johnson has made a total of 3 orders, consisting of bulk food items and cleaning supplies.
```




Note that the **AI MCP Proxy** plugin has defined two Tools as specified in the plugin configuration. In turn, each Tool can be referenced using paths which follow the original Kong Route Name, **marketplace-route** and a number.

The output prints the spec of each Tool. For example, for Tool #1, we have:
```
{
    'inputSchema': {
        'json': {
            'additionalProperties': False,
            'properties': {
                'query_id': {
                    'description': 'Optional user ID',
                    'type': 'string'
                }
            },
            'type': 'object'
        }
    },
    'name': 'marketplace-route-1',
    'description': 'Get users'
}
```




You can now click **Next** to proceed further.