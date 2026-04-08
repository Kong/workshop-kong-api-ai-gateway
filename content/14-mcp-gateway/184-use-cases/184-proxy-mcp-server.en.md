---
title : "Securing existing MCP Servers"
weight : 1840
---

Now we are going to explore the other main use case implemented by the AI MCP Proxy Plugin which is to expose and protect an existing MCP Server. For the use case we are going to use two of them: Kong MCP Server and AWS Knowledge MCP Server.

## Kong MCP Server

The Kong MCP Server was introduced last April, 2025 and it's available in GitHub. The Kong MCP Server allows you to interact with Konnect and get current configuration about your Control Planes, Kong Objects (Service, Routes, Plugins, Consumers), etc.



#### Proxy MCP requests with MCP Gateway

You can consume the Kong MCP Server directly using the URL ``https://us.mcp.konghq.com/``, adding your PAT. Once you have the Kong MCP Gateway configured, you can start consuming it just like you did with the MCP Server we crafted before. However, we want this MCP Server to sit behind the MCP Gateway and get controlled by it.

That's where the second AI MCP Proxy use case comes in: to proxy MCP requests to existing MCP Server. The architecture is illustrated below:

![Kong MCP Servers overview](/static/images/mcp_servers.png)

Here’s our new decK declaration:

:::code{showCopyAction=true showLineNumbers=false language=shell}
cat > mcp-proxy.yaml << 'EOF'
_format_version: "3.0"
_info:
  select_tags:
  - mcp
_konnect:
  control_plane_name: kong-aws
services:
- name: mcp-service
  url: https://us.mcp.konghq.com
  routes:
  - name: mcp-route
    paths:
    - /
    plugins:
    - name: ai-mcp-proxy
      enabled: true
      config:
        mode: passthrough-listener
    - name: request-transformer-advanced
      enabled: true
      config:
        add:
          headers:
          - "Authorization: Bearer ${{ env "DECK_PAT" }}"
EOF
:::



The declaration creates a new Kong Gateway Service based on the Kong MCP Server URL. The MCP Server is reachable with the “/mcp” path.

The AI MCP Proxy plugin is one more time configured, but this time with the config mode as “passthrough-listener”, meaning the MCP Gateway will listen for incoming MCP requests and proxies them to the upstream URL of the Gateway Service (```https://us.mcp.konghq.com```). The main benefit is the MCP observability metrics generation for traffic.

Before applying the declaration create the ``DECK_PAT`` environment variable:
:::code{showCopyAction=true showLineNumbers=false language=shell}
export DECK_PAT=$PAT
:::


Apply the declaration with decK:

:::code{showCopyAction=true showLineNumbers=false language=shell}
deck gateway reset --konnect-control-plane-name kong-aws --konnect-token $PAT -f
deck gateway sync --konnect-control-plane-name kong-aws --konnect-token $PAT mcp-proxy.yaml
:::

## Kong Insomnia

This time, to consume the external MCP Server, we are going to use [**Insomnia**](https://insomnia.rest), the AI-native API platform for developers to design and test any endpoint, including MCP client support. Read the documentation to learn more about it.

Inside Insomnia, start a new or use an existing Project. Click on “+” for MCP Client.

For the HTTP box, add your Kong AI Gateway Data Plane URL with the path for the Kong MCP Server we just defined, in our case, ```/mcp```. You can echo your environment variable to get it:
:::code{showCopyAction=true showLineNumbers=false language=shell}
echo $DATA_PLANE_LB
:::

The final address should be something like: ```http://a7fb7e5eb13cb421a9fa958344897e19-1135449162.us-west-2.elb.amazonaws.com```

Click the “Connect” button and "Events" tab on the right panel. You should see an error meesage saying:

```
fetch failed
cause: self signed certificate
```

Click the "Disable SSL Validation" button and turn the "SSL Certification Validation" toggle off.

Click the "Connect" button again. You should see the list of available Tools on your left. If you choose “GetControlPlane” and you should see a collection of boxes with all parameters available to run the Tool. Type ``list`` inside the "operation" box. Click “Call Tool” and see the results:

![insomnia_kong_mcp_server](/static/images/insomnia_kong_mcp_server.png)

Click “Disconnect”.




## AWS Knowledge MCP Server

AWS provides a long list of MCP Servers. A particularly interesting one is the AWS Knowledge MCP Server which provides real-time access to AWS documentation.

A similar decK declaration can be used to consume it:

:::code{showCopyAction=true showLineNumbers=false language=shell}
cat > mcp-proxy.yaml << 'EOF'
_format_version: "3.0"
_info:
  select_tags:
  - aws-mcp
_konnect:
  control_plane_name: kong-aws
services:
- name: aws-mcp-service
  url: https://knowledge-mcp.global.api.aws
  routes:
  - name: aws-mcp-route
    paths:
    - /
    plugins:
    - name: ai-mcp-proxy
      enabled: true
      config:
        mode: passthrough-listener
EOF
:::

Apply the declaration with decK:

:::code{showCopyAction=true showLineNumbers=false language=shell}
deck gateway reset --konnect-control-plane-name kong-aws --konnect-token $PAT -f
deck gateway sync --konnect-control-plane-name kong-aws --konnect-token $PAT mcp-proxy.yaml
:::


Go back to **Insomnia** and click “Connect”. You should see on the list of available Tools on your left. Choose “aws__read_documentation".

In the middle pane, inside the “url” box type: https://docs.aws.amazon.com/eks/latest/userguide/what-is-eks.html or any AWS documentation link. Click “Call Tool”.

Click “Call Tool” and see the results:

![insomnia_aws_mcp_server](/static/images/insomnia_aws_mcp_server.png)

Click “Disconnect”.



You can now click **Next** to proceed further.