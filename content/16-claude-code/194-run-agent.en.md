---
title : "Run the Strands Agent"
weight : 194
---



### Run the Agent

```
python3 strands_kong_agent.py
```

You should see the Agent response and a prompt:

<pre style="font-size: 0.7em">
MCP tools available: ['marketplace-route-1', 'marketplace-route-2']
Sure! Let me start by finding Alice Johnson's user ID.
Tool #1: marketplace-route-1
original_stop_reason=<end_turn>, new_stop_reason=<tool_use> | overriding stop reason due to toolUse blocks in response
Alice Johnson's user ID is **a1b2c3d4**. Now let me fetch her orders!
Tool #2: marketplace-route-2
original_stop_reason=<end_turn>, new_stop_reason=<tool_use> | overriding stop reason due to toolUse blocks in response
Here are all the orders made by **Alice Johnson** (User ID: `a1b2c3d4`):

| # | Order ID | Item |
|---|----------|------|
| 1 | ord001 | Sugar (50kg) |
| 2 | ord002 | Cleaning Supplies Pack |
| 3 | ord003 | Canned Tomatoes (100 cans) |

Alice Johnson has placed a total of **3 orders**. Let me know if you'd like more details or want to take any action on these orders!
Agent: 
</pre>




### Check Konnect Observability

Since, all Strands Agent requests went through the Kong AI Gateway you can check them inside the **Observability** option. Open the **AI Dashboard** you created previously and check it out


![agent-observability](/static/images/claude_code_observability.png)



You can now click **Next** to proceed further.