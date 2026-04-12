---
title : "Create the Strands Agent"
weight : 193
---


## Instruct Claude Code
Now we are going to ask **Claude Code** to create the Strands Agent consuming Kong AI Gateway, Claude Opus 4.6 LLM and the MCP Server.

Copy the following instructions and paste them to the **Claude Code** prompt.

```
Write a Strands Agent code to consume Kong AI Gateway.
Follow these instructions:
. Kong AI Gateway is running on my local Minikube cluster and exposed by a Load Balancer. Look for a Kubernetes service named "proxy-kong-workshop " deployed in the "kong" namespace.
. The Kong AI Gateway Route for the MCP Server is /mcp-listener.
. The Kong AI Gateway Route for LLM is /anthropic-route.
. Use the Strands' OpenAI Model Provider to connect to Kong AI Gateway.
```


 Anthropic requires a tool to connect. So for the /v1/messsages requests use  with a dummy tool to connect to this endpoint.

. Show the /v1/messages request before sending them.

You should see:
```
❯ [Pasted text #1 +4 lines]                     
```

Press ``enter``.

### Grant permissions to Claude Code

**Claude Code** will then start asking multiple questions asking for permissions to run the necessary commands to craft the Agent. For example, to execute ``kubectl``, ``pip``, etc. 


As an example, here's the first question **Claude Code** will ask you:


<pre style="font-size: 0.7em">
╭─── Claude Code v2.1.104 ───────────────────────────────────────────────────────────────────────────────────────────────╮
│                                                      Tips for getting started                                          │
│                 Welcome back Acqua!                  Run /init to create a CLAUDE.md file with instructions for Claude │
│                                                      ───────────────────────────────────────────────────────────────── │
│                      ▗ ▗   ▖ ▖                       Recent activity                                                   │
│                                                      No recent activity                                                │
│                        ▘▘ ▝▝                                                                                           │
│ Opus 4.6 · API Usage Billing · Acqua’s Individual                                                                      │
│ Org                                                                                                                    │
│   ~/…/GitHub/Workshops/temp/claudecode-workshop                                                                        │
╰────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯

❯ /status                                                                                                                                                                                                     
  ⎿  Status dialog dismissed                              

❯ Write a Strands Agent code to consume Kong AI Gateway.
  Follow these instructions: 
  . Kong AI Gateway is running on my local Minikube cluster and exposed by a Load Balancer. Look for a Kubernetes service named "proxy-kong-workshop " deployed in the "kong" namespace.                                                                                     
  . The Kong AI Gateway Route for the MCP Server is /mcp-listener.                                                                                                                                                                                                           
  . The Kong AI Gateway Route for LLM is /anthropic-route.                                                                                                                                                                                                                   
  . Use the Strands' OpenAI Model Provider to connect to Kong AI Gateway.                                                                                                                                                                                                    

⏺ Let me get the Kong service details and research the Strands SDK in parallel.

⏺ Bash(kubectl get svc proxy-kong-workshop -n kong -o json 2>&1)
  ⎿  {
         "apiVersion": "v1",
         "kind": "Service",
     … +71 lines (ctrl+o to expand)

⏺ Agent(Research Strands Agents SDK)
  ⎿  Done (40 tool uses · 54.7k tokens · 3m 32s)
  (ctrl+o to expand)

⏺ Good. Here's what I've gathered:

  - Kong Gateway endpoint: http://127.0.0.1:80 (LoadBalancer IP from the proxy-kong-workshop service)
  - LLM route: /anthropic-route
  - MCP route: /mcp-listener
  - Strands SDK: Uses OpenAIModel with client_args for custom base_url, and MCPClient with streamablehttp_client for MCP tools.

  Let me check the existing project structure, then write the code.

  Read 1 file, listed 1 directory (ctrl+o to expand)

⏺ Now let me write the Strands Agent code and a requirements file.

⏺ Write(requirements.txt)
  ⎿  Wrote 1 lines to requirements.txt
      1 strands-agents[openai]

⏺ Write(strands_kong_agent.py)
  ⎿  Wrote 68 lines to strands_kong_agent.py
       1 """
       2 Strands Agent consuming Kong AI Gateway.
       3
       4 Kong AI Gateway is running on a local Minikube cluster, exposed via a LoadBalancer
       5 at http://127.0.0.1:80. The gateway provides:
       6   - /anthropic-route  -> LLM proxy (OpenAI-compatible)
       7   - /mcp-listener     -> MCP Server (Streamable HTTP)
       8 """
       9
      10 from strands import Agent
     … +58 lines (ctrl+o to expand)

⏺ Done. I've created two files:

  strands_kong_agent.py

  The agent is wired to your Kong AI Gateway at http://127.0.0.1:80 with:

  1. LLM via OpenAI Model Provider — connects to http://127.0.0.1:80/anthropic-route/v1 using OpenAIModel with client_args for the custom base URL. Kong handles upstream auth, so the API key is a placeholder.
  2. MCP Tools via Streamable HTTP — connects to http://127.0.0.1:80/mcp-listener using MCPClient with streamablehttp_client. Tools are discovered automatically on startup.
  3. Interactive loop — prints the discovered MCP tools, then lets you chat with the agent.

  requirements.txt

  strands-agents[openai]

  The [openai] extra pulls in the OpenAI SDK, and mcp is already a core dependency.

  To run it

  pip install -r requirements.txt
  python strands_kong_agent.py
</pre>

Grant permissions to all requests.


### Wait for the code creation process to complete

**Claude Code** will perform several tasks to craft the Strands Agent code, including installing the Strands Agent Python package, connecting to Kong AI Gateway, etc.

As **Claude Code** runs and you grant permissions to it, you can check your directory. Eventually, **Claude Code** will create a new file, named ``strands_kong_agent.py ``. Besides, a new ``venv`` directory will be created with all Python settings you should use to run the Agent in your terminal.


Here's a snippet of **Claude Code** output showing that the Agent code has been created.


<pre style="font-size: 0.7em">
⏺ Done. I've created two files:                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                             
  strands_kong_agent.py                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                             
  The agent is wired to your Kong AI Gateway at http://127.0.0.1:80 with:
                                                 
  1. LLM via OpenAI Model Provider — connects to http://127.0.0.1:80/anthropic-route/v1 using OpenAIModel with client_args for the custom base URL. Kong handles upstream auth, so the API key is a placeholder.                                                             
  2. MCP Tools via Streamable HTTP — connects to http://127.0.0.1:80/mcp-listener using MCPClient with streamablehttp_client. Tools are discovered automatically on startup.
  3. Interactive loop — prints the discovered MCP tools, then lets you chat with the agent.                                                                                                                                                                                  
                                                                                                                                                                                                                                                                             
  requirements.txt                                                                                                                                                                                                                                                           
                                                                                                                                                                                                                                                                             
  strands-agents[openai]                                                                                                                                                                                                                                                     
                                                                                                                                                                                                                                                                             
  The [openai] extra pulls in the OpenAI SDK, and mcp is already a core dependency.                                                                                                                                                                                          
                                                                                                                                                                                                                                                                             
  To run it                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                             
  pip install -r requirements.txt
  python strands_kong_agent.py
                                                                                                                                                                                                                                                                             
✻ Crunched for 3m 22s                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                             
─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
❯                                                                                                                                                                                                                                                                            
─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  ⏵⏵ accept edits on (shift+tab to cycle)
</pre>



### Test the Agent inside Claude Code

Now copy the following instruction and paste it to the **Claude Code** prompt:

```
Playing the Agent role, ask Kong AI Gateway to list all orders made by Alice Johnson
```


The result should be something like this:

<pre style="font-size: 0.7em">
⏺ The agent ran successfully. Here's what happened:                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                             
  1. MCP tool discovery — found 2 tools: marketplace-route-1 and marketplace-route-2                                                                                                                                                                                         
  2. Tool call #1 (marketplace-route-1) — looked up Alice Johnson's user ID (a1b2c3d4)                                                                                                                                                                                       
  3. Tool call #2 (marketplace-route-2) — fetched her orders using that ID                                                                                                                                                                                                   
                                                                                                                                                                                                                                                                             
  Alice Johnson's orders:                                                                                                                                                                                                                                                    
                                                            
  ┌─────┬──────────┬────────────────────────────┐                                                                                                                                                                                                                            
  │  #  │ Order ID │            Item            │           
  ├─────┼──────────┼────────────────────────────┤
  │ 1   │ ord001   │ Sugar (50kg)               │
  ├─────┼──────────┼────────────────────────────┤
  │ 2   │ ord002   │ Cleaning Supplies Pack     │
  ├─────┼──────────┼────────────────────────────┤
  │ 3   │ ord003   │ Canned Tomatoes (100 cans) │
  └─────┴──────────┴────────────────────────────┘                                                                                                                                                                                                                            
  
  The Strands Agent successfully consumed both Kong AI Gateway routes — /anthropic-route for the LLM and /mcp-listener for the MCP tools.                                                                                                                                    
                                                            
─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
❯                                                                                 
─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  ⏵⏵ accept edits on (shift+tab to cycle)           
</pre>



Now you are ok to quit **Claude Code**. Type or copy-and-paste the following command:

```
quit
```


You should get redirected to your terminal.




You can now click **Next** to proceed further.