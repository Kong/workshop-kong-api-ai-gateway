---
title: "Kong AI Assistant & Kong Konnect MCP Server"
weight: 170
---

Kong’s AI assistant, [KAi](https://developer.konghq.com/konnect-platform/kai/), can detect issues, suggest fixes, and accelerate your workflows all without leaving the Konnect UI. KAi is enabled by default for Konnect Plus and trial accounts. KAi is always disabled by default. You can enable KAi by enabling it in **Konnect Labs**, inside the **Organization** menu option.

KAi can help you do the following:

* Run a debug session to analyze API performance issues
* Provides recommendations to improve API performance
* Answer any Konnect questions using the Kong Docs


### How KAi works
KAi is made up of a series of components running inside Konnect. The agent can perform smart orchestration and analysis of Konnect data and entities. You can interact with the agent in the following ways:

* Use the chat in the Konnect UI by clicking the sparkle icon ✨ on the top right.
* Use the [``kongctl``](https://github.com/Kong/kongctl) command-line tool with the ``kongctl kai`` command.
The KAi agent uses backend LLMs for reasoning and natural language tasks. It also uses a Konnect MCP server to provide information about Konnect and the user’s entities and data. Because the MCP server is authenticated via the logged-in user’s session, it only has access to data and resources that the user themselves has permission to access.

KAi also has access to Kong’s documentation and support knowledge base, so it can provide guidance on configuration, architecture, and troubleshooting.

![Kai](/static/images/kai.png)


### How to interact with KAi in the UI
To start a chat with KAi, click the sparkle icon ✨ on the top right of the Konnect UI.

KAi is context-sensitive, so if you navigate to a control plane or Gateway Service, KAi will use that entity context to answer questions. You can create a new session from the Active session dropdown menu by selecting “New conversation”. Each user is limited to three sessions. To delete a session, click the action menu icon next to the session and click Delete.

![Kai](/static/images/kai_ui.png)




### Use the Konnect MCP Server with external tools

The same Konnect MCP Server that powers KAi is available for use with external AI assistants and IDE copilots. This allows you to interact with your Konnect resources directly from your development environment.

With the MCP server, you can:

* Query gateway entities (control planes, services, routes, consumers, plugins)
* Create and analyze debug sessions for performance issues
* Search Kong documentation
* Analyze API traffic


![Konnect MCP Server](/static/images/konnect-mcp-architecture.svg)

Learn how to configure the [Kong Konnect MCP server](https://developer.konghq.com/konnect-platform/konnect-mcp/)



