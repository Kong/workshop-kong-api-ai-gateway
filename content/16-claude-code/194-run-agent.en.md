---
title : "Run the Strands Agent"
weight : 194
---


### Set your Python environment

Now, you need to set your local Python environment to tell it you have a new application:

```
. ./.venv/bin/activate
```



### Run the Agent

```
python3 strands_kong_agent.py
```

You should see the Agent response and a prompt:

```
============================================================
  Strands Agent → Kong AI Gateway → Amazon Bedrock
  MCP tools served via Kong AI Gateway
============================================================

Type your message (or "quit" to exit):

You: 
```


Type the same question you did before:


```
list all orders made by Alice 
```


You should see similar responses:

```
You: list all orders made by Alice 

I'll help you find all orders made by Alice. First, let me get the users to find Alice's user ID, then retrieve her orders.
Tool #1: marketplace-route-1
I found Alice Johnson with ID "a1b2c3d4". Now let me get her orders:
Tool #2: marketplace-route-2
## Orders made by Alice Johnson:

Based on the search results, Alice Johnson (ID: a1b2c3d4) has made **3 orders**:

1. **Order #ord001** - Sugar (50kg)
2. **Order #ord002** - Cleaning Supplies Pack  
3. **Order #ord003** - Canned Tomatoes (100 cans)

Alice's orders include a mix of food items (sugar and canned tomatoes) and household supplies (cleaning supplies pack).

You: 
```


You can try other prompts like:
```
how about Ian Walker's?
```

or

```
and Claudio's?
```


Type ``ˆC`` to exit.



### Check Konnect Observability

Since, all Strands Agent requests went through the Kong AI Gateway you can check them inside the **Observability** option. Open the **AI Dashboard** you created previously and check it out


![agent-observability](/static/images/claude_code_observability.png)



You can now click **Next** to proceed further.