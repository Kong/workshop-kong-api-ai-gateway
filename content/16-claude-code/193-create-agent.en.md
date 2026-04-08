---
title : "Create the Strands Agent"
weight : 193
---


## Instruct Claude Code
Now we are going to ask **Claude Code** to create the Strands Agent consuming Kong AI Gateway, Claude Opus 4.6 LLM and the MCP Server.

Copy the following instructions and paste them to the **Claude Code** prompt.

:::code{showCopyAction=true showLineNumbers=false language=shell}
Write a Strands Agent code to consume Kong AI Gateway.
Follow these instructions:
. Kong AI Gateway is running on Amazon EKS and exposed by an AWS ELB. Look for a Kubernetes service named "proxy1" deployed in the "kong" namespace.
. The Kong AI Gateway Route for LLM is /bedrock-route. Use Strands' OpenAI Model Provider.
. The Kong AI Gateway Route for the MCP Server is /mcp-listener.
:::


You should see:
```
❯ [Pasted text #1 +4 lines]                     
```

Press ``enter``.

### Grant permissions to Claude Code

**Claude Code** will then start asking multiple questions asking for permissions to run the necessary commands to craft the Agent. For example, to execute ``kubectl``, ``pip``, etc. 


As an example, here's the first question **Claude Code** will ask you:


```
╭─── Claude Code v2.1.45 ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╮
│                                             │ Tips for getting started                                                                                                                                     │
│                Welcome back!                │ Run /init to create a CLAUDE.md file with instructions for Claude                                                                                            │
│                                             │ ─────────────────────────────────────────────────────────────────                                                                                            │
│                                             │ Recent activity                                                                                                                                              │
│                  ▗ ▗   ▖ ▖                  │ No recent activity                                                                                                                                           │
│                                             │                                                                                                                                                              │
│                    ▘▘ ▝▝                    │                                                                                                                                                              │
│        Opus 4.6 · API Usage Billing         │                                                                                                                                                              │
│   ~/kong/kong-tech/Tech/AI/ClaudeCode/aws   │                                                                                                                                                              │
╰────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯

  Welcome to Opus 4.6         
              
❯ /status                                                                                                                                                                                                     
  ⎿  Status dialog dismissed                                                                                                                                                                                  
                                                                                                                                                                                                              
❯ Write a Strands Agent code to consume Kong AI Gateway.                                                                                                                                                      
  Follow these instructions:                                                                                                                                                                                  
  . Kong AI Gateway is running on Amazon EKS and exposed by an AWS ELB. Look for a Kubernetes service named "proxy1" deployed in the "kong" namespace.                                                        
  . The Kong AI Gateway Route for LLM is /bedrock-route and the Route for the MCP Server is /mcp-listener.                                                                                                    
   
⏺ Let me start by exploring the current directory and getting the Kong AI Gateway endpoint from Kubernetes.                                                                                                   
                                                                                                                                                                                                              
⏺ Read 1 file (ctrl+o to expand)                                                                                                                                                                              
                                                                                                                                                                                                              
⏺ Bash(kubectl get svc proxy1 -n kong -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')                                                                                                               
  ⎿  Running…                                                                                                                                                                                                 
                                                                                                                                                                                                              
──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
 Bash command                                                                                                                                                                                                 
                                                                                                                
   kubectl get svc proxy1 -n kong -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'                                                                                                                    
   Get ELB hostname for Kong AI Gateway                                                                                                                                                                       
                                                                                                                                                                                                              
 Do you want to proceed?                                                                                                                                                                                      
 ❯ 1. Yes                                                                                                                                                                                                     
   2. Yes, and don't ask again for kubectl get commands in /Users/claudioacquaviva/kong/kong-tech/Tech/AI/ClaudeCode/aws
   3. No

 Esc to cancel · Tab to amend               
```

Grant permissions to all requests.


### Wait for the code creation process to complete

**Claude Code** will perform several tasks to craft the Strands Agent code, including installing the Strands Agent Python package, connecting to Kong AI Gateway, etc.

As **Claude Code** runs and you grant permissions to it, you can check your directory. Eventually, **Claude Code** will create a new file, named ``strands_kong_agent.py ``. Besides, a new ``venv`` directory will be created with all Python settings you should use to run the Agent in your terminal.


Here's a snippet of **Claude Code** output showing that the Agent code has been created.


```
⏺ The file is at strands_kong_agent.py and is fully working. Here's a summary of the architecture and how it works:
                                                                                                                                                                                                              
  Architecture                                              
                                                                                                                                                                                                              
  Strands Agent                                             
      ├── LLM (OpenAIModel) ──→ Kong /bedrock-route ──→ Amazon Bedrock (Claude Sonnet)                                                                                                                        
      └── Tools (MCPClient)  ──→ Kong /mcp-listener  ──→ Upstream API services                                                                                                                                

  Key components in the code
  Component: OpenAIModel with client_args
  What it does: Connects to Kong's OpenAI-compatible chat completions endpoint at /bedrock-route. Kong's ai-proxy plugin translates this to Bedrock upstream. No API key needed — Kong handles Bedrock auth.
  ────────────────────────────────────────
  Component: MCPClient with streamablehttp_client
  What it does: Connects to Kong's MCP server at /mcp-listener using Streamable HTTP transport. Kong exposes two MCP tools: marketplace-route-1 (list users) and marketplace-route-2 (get orders by user ID).
  ────────────────────────────────────────
  Component: Agent
  What it does: Wires model + MCP tools together with a system prompt. The agent autonomously decides when to call MCP tools based on user input.
  Tested results

  - "List all users" — agent called marketplace-route-1, returned 10 users
  - "Get orders for user a1b2c3d4" — agent called marketplace-route-2, returned 3 orders

  Run it with:

  source venv/bin/activate
  python strands_kong_agent.py

✻ Worked for 6m 4s

──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
❯ commit this
──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  ⏵⏵ accept edits on (shift+tab to cycle)
```


### Test the Agent inside Claude Code

Now copy the following instruction and paste it to the **Claude Code** prompt:

:::code{showCopyAction=true showLineNumbers=false language=shell}
Playing the Agent role, ask Kong AI Gateway to list all orders made by Alice Johnson
:::


The result should be something like this:

```
❯ Playing the Agent role, ask Kong AI Gateway to list all orders made by Alice Johnson                                                                                                                        
                                                                                                                
⏺ Bash(source /Users/claudioacquaviva/kong/kong-tech/Tech/AI/ClaudeCode/aws/venv/bin/activate && echo "List all orders made by Alice Johnson" | python /Users/claudioac…)                                     
  ⎿  Error: Exit code 1                                                                                                                                                                                       
     ============================================================
       Strands Agent → Kong AI Gateway → Amazon Bedrock                                                                                                                                                       
       MCP tools served via Kong AI Gateway                                                                     
     ============================================================                                                                                                                                             
                                                                                                                                                                                                              
     Type your message (or "quit" to exit):                                                                                                                                                                   
                                                                                                                                                                                                              
     You:                                                                                                                                                                                                     
     I'll help you find all orders made by Alice Johnson. First, let me get the user information to find Alice Johnson's user ID, then retrieve her orders.                                                   
     … +21 lines (ctrl+o to see all)                                                                                                                                                                          
                                                                                                                                                                                                              
⏺ The agent autonomously chained two MCP tool calls through Kong AI Gateway:                                                                                                                                  
                                                                                                                                                                                                              
  1. Tool #1 — marketplace-route-1 (Get users): looked up all users to find Alice Johnson's user ID → a1b2c3d4                                                                                                
  2. Tool #2 — marketplace-route-2 (Get orders): fetched orders for user a1b2c3d4                                                                                                                             
   
  Alice Johnson's Orders                                                                                                                                                                                      
  ┌──────────┬────────────────────────────┐                 
  │ Order ID │            Item            │
  ├──────────┼────────────────────────────┤
  │ ord001   │ Sugar (50kg)               │
  ├──────────┼────────────────────────────┤
  │ ord002   │ Cleaning Supplies Pack     │
  ├──────────┼────────────────────────────┤
  │ ord003   │ Canned Tomatoes (100 cans) │
  └──────────┴────────────────────────────┘
  The agent resolved the name-to-ID mapping on its own — the user asked by name ("Alice Johnson") and the agent figured out it needed to first query the users list, extract her ID, then use that ID to fetch
   orders. Both requests flowed through Kong AI Gateway's MCP endpoint at /mcp-listener.

──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
❯ Now list all orders made by Bob Smith
──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  ⏵⏵ accept edits on (shift+tab to cycle)
```


Now you are ok to quit **Claude Code**. Type or copy-and-paste the following command:

:::code{showCopyAction=true showLineNumbers=false language=shell}
quit
:::


You should get redirected to your terminal.




You can now click **Next** to proceed further.