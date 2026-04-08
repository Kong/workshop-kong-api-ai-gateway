---
title : "MCP Introduction"
weight : 142
---

We’ve seen a lot of momentum around the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/), the new standard proposed by [Anthropic](https://www.anthropic.com/news/model-context-protocol) in November 2024.

As described in its official portal, MCP follows a [client-server architecture](https://modelcontextprotocol.io/docs/learn/architecture#participants) where an AI application (tool or AI Agent) connects to MCP Servers. The MCP specification defines three participants as illustrated above in the diagram taken from the MCP portal:

* **MCP Host**: The AI application (tool, application, agent) that coordinates and manages one or multiple MCP clients
* **MCP Client**: A component that maintains a connection to an MCP server and obtains context from an MCP server for the MCP host to use
* **MCP Server**: A program that provides context to MCP clients

![MCP Client-Server](/static/images/mcp_client_server.png)

Each MCP Server is responsible for exposing [MCP primitives](https://modelcontextprotocol.io/docs/learn/architecture#primitives) to the Clients:

* **Tools**: functions that a MCP Client can invoke.
* **Resources**: Data sources that provide contextual information to the Client.
* **Prompts**: Reusable templates that help structure interactions with language models (e.g., system prompts, few-shot examples)

Check the [Architecture Overview](https://modelcontextprotocol.io/docs/learn/architecture) page in the MCP documentation portal to learn more about it.



## MCP Communication Fundamentals

MCP introduces the notion of [Layers](https://modelcontextprotocol.io/docs/learn/architecture#layers):

* Data layer: defines the protocol for MCP Client and MCP Server communication, based on [JSON-RPC 2.0](https://www.jsonrpc.org/).

* Transport Layer: defines the mechanisms to enable the data exchange between the MCP Client and MCP Server. Basically it supports two mechanisms:
  * [Stdio](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports#stdio): based on standard input/output streams. It's helpful for communication between tools like Cursor, which plays the MCP Host role, and local MCP Server running in Docker, for example.
  * [Streamable HTTP](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports#streamable-http): the MCP Client and MCP Server connectivity is based on HTTP.

For the purpose of this workshop, where the Kong AI Gateway mediates the communication between the MCP Client and MCP Server, we are going to focus on the Streamable HTTP mechanism.


## MCP and LLM Sequence Diagram

With the introduction of MCP, it's important to understand the relationship between the Tools and the GenAI models.

The diagram below describes what happens when an Agent sends a request like "What's the weather in San Francisco today?":

![MCP Sequence Diagram](/static/images/mcp_sequence_diagram.png)

1. The MCP Client, inside the Agent, connects the MCP Server(s) to ensure it has up-to-date tool definitions.
2. When the User sends a message ("What's the weather in SF?"), the MCP Client sends it to the LLM, injecting the tools list it got from the the MCP Server. The LLM, considering the messages and tools, replies back instructing the MCP Client on what tool, including its parameters, the MCP Client should actually call. In our case, ``get_weather{"city": "SF"}``.
3. The MCP Client calls the ``get_weather`` tool and gets the results.
4. The MCP Client sends the final request to the LLM, including the message as well as the tool call results it got. The LLM replies back with the final outcome.

Notably, the actual logic executed here is just a standard API call, which illustrates an important point. MCP does not replace APIs, it’s just an additional interface to make APIs more LLM friendly.

As described later, Kong MCP Gateway abstracts, from the User/Agent perspective, the LLMs and MCP Servers.


## MCP and RAG

A fairly common question arises when we think about providing contexts for LLMs: what are the similarities and differences between [**RAG (Retrieval-Augmented Generation)**](https://aws.amazon.com/what-is/retrieval-augmented-generation/) and **MCP**? After all, both mechanisms can be used to control external context injection into an LLM system.

Roughly speaking, **RAG** provides informational context by retrieving pre-indexed information and documents, typically stored in a vector database as **MCP** provides operational context allowing models to interact with live external systems.

AWS provides the [**Generative AI Atlas**](https://awslabs.github.io/generative-ai-atlas) knowledge base with an extensive collection of GenAI fundamentls, concepts and whitepapers

The specific paper [**Model Context Protocol (MCP): Dynamic External Context Access**](https://awslabs.github.io/generative-ai-atlas/topics/2_0_technical_foundations_and_patterns/2_1_key_primitives/2_1_11_mcp/mcp.html) presents a nice introduction to **MCP** including some comparison with **RAG**. It's worth reading.


# Further Reading
* [What is MCP?](https://konghq.com/blog/learning-center/what-is-mcp)


You can now click **Next** to proceed further.