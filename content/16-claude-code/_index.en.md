---
title : "Kong AI/MCP Gateway, Claude Code and Anthropic"
weight : 160
---

In this part of the workshop we are going to consume the infrastructure abstracted by Kong AI Gateway, including Anthropic LLM models and the MCP Server and its two MCP Tools. We will present an introductory tutorial to learn how to use [**Claude Code**](https://code.claude.com/) to accelerate your AI Agent developement process.

The tutorial leverages the new [**Claude Opus 4.6**](https://www.anthropic.com/news/claude-opus-4-6), the best coding model provided by **Anthropic**.


The tutorial goes through the following steps:
* Configure **Kong AI Gateway** to work with **Anthropic**
* Configure **Claude Code** to work with **Kong AI Gateway**
* Work with **Claude Code** to consume **Kong AI Gateway** and the LLMs and MCP Servers sitting behind it and create a **Strands Agent** code.
* Test the **Strands Agent**.

Here's the architecture: Kong Data Plane protects Anthropic's Models, **Claude Opus 4.6**, **Claude Haiku 4.5** and **Claude Sonnet 4.6**, running inside Amazon Bedrock for the two main scenarios:
* Strands Agent Code Generation
* Strands Agent Runtime



![ClaudeCode](/static/images/claude_code.png)


# Further Reading
* [Claude Code Quickstart](https://code.claude.com/docs/en/quickstart)




You can now click **Next** to begin the module.

