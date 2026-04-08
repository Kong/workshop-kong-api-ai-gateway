---
title : "Kong MCP Gateway and Plugins"
weight : 143
---

### Kong MCP Gateway

With Kong MCP Gateway we expose and secure all MCP Servers in a single place. Also, the MCP Gateway controls the consumption of the MCP Servers with [OAuth 2.1](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization), as described in the MCP documentation portal.

![MCP Gateway](/static/images/mcp_gateway.png)



### Kong MCP Plugins

In this part we will explore the two new plugins introduced by Kong AI Gateway:
* [AI MCP Proxy](https://developer.konghq.com/plugins/ai-mcp-proxy) plugin: it works as a protocol bridge, translating between MCP and HTTP so that MCP-compatible clients can either call existing APIs or interact with upstream MCP servers through Kong
* [AI MCP OAuth2](https://developer.konghq.com/plugins/ai-mcp-oauth2) plugin: implements the OAuth 2.0 specification for MCP servers




# Further Reading
* [What is a MCP Gateway?](https://konghq.com/blog/learning-center/what-is-a-mcp-gateway)
* [Kong AI/MCP Gateway and Kong MCP Server Technical Breakdown](https://konghq.com/blog/engineering/ai-gateway-mcp-gateway-mcp-server-breakdown)
* [AI Agent with Strands SDK, Kong AI/MCP Gateway & Amazon Bedrock](https://konghq.com/blog/engineering/ai-agent-with-strands-kong-aimcp-gateway-bedrock)


You can now click **Next** to proceed further.