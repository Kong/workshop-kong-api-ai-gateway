---
title : "Test the MCP Tools"
weight : 30
---

Since we have all components in place, we can test the new MCP Tool. Here's the new code:

:::code{showCopyAction=true showLineNumbers=false language=shell}
cat > kong-mcp-kong-identity.py << 'EOF'
import asyncio
import os
import json

from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client

import aiohttp

data_plane_lb = os.getenv("DATA_PLANE_LB");

kong_dp = os.getenv("DATA_PLANE_LB");
kong_dp_route = f"http://{data_plane_lb}/mcp-listener"

print("kong_dp_route")
print(kong_dp_route)


KONG_IDENTITY_URL = os.getenv("ISSUER_URL");
token_url = f"{KONG_IDENTITY_URL}/oauth/token"
client_id = os.getenv("DECK_CLIENT_ID")
client_secret = os.getenv("DECK_CLIENT_SECRET")

print ("KONG_IDENTITY: " + token_url)
print ("CLIENT_ID: " + client_id)
print ("CLIENT_SECRET: " + client_secret)


async def get_access_token():
    """
    Fetch OAuth2 token using Client Credentials grant.
    """
    token_data = os.getenv("TOKEN")
    if token_data is not None:
        print("Env Var Token is set")
        return token_data

    async with aiohttp.ClientSession() as http:
        async with http.post(
            token_url,
            data={
                "grant_type": "client_credentials",
                "client_id": client_id,
                "client_secret": client_secret,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        ) as resp:
            if resp.status != 200:
                raise RuntimeError(f"OAuth token error: {resp.status} {await resp.text()}")
            token_data = await resp.json()
            return token_data["access_token"]


async def main():
    token = await get_access_token()
    print("Received OAuth Access Token")
    print(token)

    # Connect to a streamable HTTP server
    async with streamablehttp_client(kong_dp_route, headers={"Authorization": f"Bearer {token}"}) as (read_stream, write_stream, _,):
        print("Create a session using the client streams")
        async with ClientSession(read_stream, write_stream) as session:
            print("Initialize the connection")
            await session.initialize()
            print("List available tools")
            tools = await session.list_tools()
            print(f"Available tools: {[tool.name for tool in tools.tools]}")

            print(f"Executing tool: marketplace-route-1")
            result = await session.call_tool("marketplace-route-1", {"query_id": "u1v2w3x4"});
            print(result)


if __name__ == "__main__":
    asyncio.run(main())
EOF
:::


The code checks if the environment variable ```TOKEN``` is set. If it's not, the code goes to Kong Identity, through the **Client Credentials** Grant and get one. If the variables exists, the code uses it. To establish connections with the MCP Server, the **AI MCP OAuth2** plugin hits Keycloak using the **Introspection** flow to see if the token is still valid.



### Test the MCP Tool

If run the code with:

:::code{showCopyAction=true showLineNumbers=false language=shell}
python3 kong-mcp-kong-identity.py
:::

You should see a response similar to this. Note the agent lists the two MCP Tools created and managed by the Kong MCP Gateway:

```
kong_dp_route
http://a7fb7e5eb13cb421a9fa958344897e19-1135449162.us-west-2.elb.amazonaws.com/mcp-listener
KONG_IDENTITY: https://lpjwyco0nr07jrva.us.identity.konghq.com/auth/oauth/token
CLIENT_ID: p4aih3vylfgl3d8a
CLIENT_SECRET: 7o85r56b48aiba4hrxc60i6n
Received OAuth Access Token
eyJhbGciOiJSUzI1NiIsImtpZCI6IjBjNmI0ZGEzLWU5NTQtNDNmYi1iNDM1LTI5ZGYwNGY0MGJkZiIsInR5cCI6IkpXVCJ9.eyJhdWQiOlsiaHR0cDovL21jcF90b29scy5kZXYiXSwiY2xpZW50X2lkIjoicDRhaWgzdnlsZmdsM2Q4YSIsImV4cCI6MTc3MTM1MTcwNCwiaWF0IjoxNzcxMzUxNjQ0LCJpc3MiOiJodHRwczovL2xwand5Y28wbnIwN2pydmEudXMuaWRlbnRpdHkua29uZ2hxLmNvbS9hdXRoIiwianRpIjoiMDE5YzZjYzktMTc2NS03MjczLWI1ZDEtYWUyMTFjOGM2ZTk5IiwibmJmIjoxNzcxMzUxNjQ0LCJzY29wZSI6IiIsInN1YiI6InA0YWloM3Z5bGZnbDNkOGEifQ.gmXsnInPkTOPQbfdhiUiHGD9xNwUumvXvp5gbSYfulrj4YNLI4WTMr667nWwBQjtHpL1E-GygOjifp-VzODBBG_tAA2RH0GMHHow2FFx7KABaQhk8MFlnyAW-_uYxS1CCISzLMd3HjYvonZ5fU3s_g7bVrI66TdwomwtVx-L4WzjGmuZnfWWyAQ9BlDuuiBAqlThGppYBclD5h1kMqbv8GVzGxWz-m_l1BJKDd0h-kr-YVlY9Nq-54aZudgGuoZWySe8Erf97-j5H3r0fLnBhJ45i0mWzaQderJi3_N7XZQsiBnxajSmMnQb8OaqB2klMa0hulgCwIKYd4N7Rv9fug
Create a session using the client streams
Initialize the connection
List available tools
Available tools: ['marketplace-route-1', 'marketplace-route-2']
Executing tool: marketplace-route-1
meta=None content=[TextContent(type='text', text='[{"fullName":"Alice Johnson","id":"a1b2c3d4"},{"fullName":"Bob Smith","id":"e5f6g7h8"},{"fullName":"Charlie Lee","id":"i9j0k1l2"},{"fullName":"Diana Evans","id":"m3n4o5p6"},{"fullName":"Ethan Brown","id":"q7r8s9t0"},{"fullName":"Fiona Clark","id":"u1v2w3x4"},{"fullName":"George Harris","id":"y5z6a7b8"},{"fullName":"Hannah Lewis","id":"c9d0e1f2"},{"fullName":"Ian Walker","id":"g3h4i5j6"},{"fullName":"Julia Turner","id":"k7l8m9n0"}]', annotations=None, meta=None)] structuredContent=None isError=False
```

If you set the ```TOKEN``` environment variable with the token you received, wait for the timeout and running the code again. You should see an error message related to it.



You can now click **Next** to proceed further.