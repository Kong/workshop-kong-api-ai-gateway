---
title : "Round Robin"
weight : 2
---

Let's get started with a simple round-robin policy:

:::code{showCopyAction=true showLineNumbers=false language=shell}
cat > ai-proxy-advanced.yaml << 'EOF'
_format_version: "3.0"
_info:
  select_tags:
  - bedrock
_konnect:
  control_plane_name: kong-aws
services:
- name: ai-proxy-advanced-service
  host: localhost
  port: 32000
  routes:
  - name: route1
    paths:
    - /bedrock-route
    plugins:
    - name: ai-proxy-advanced
      instance_name: ai-proxy-advanced-bedrock
      config:
        balancer:
          algorithm: round-robin
        targets:
        - model:
            provider: bedrock
            name: "us.amazon.nova-micro-v1:0"
            options:
              bedrock:
                aws_region: us-west-2
          route_type: "llm/v1/chat"
          auth:
            allow_override: false
        - model:
            provider: bedrock
            name: "us.meta.llama3-3-70b-instruct-v1:0"
            options:
              bedrock:
                aws_region: us-west-2
          route_type: "llm/v1/chat"
          auth:
            allow_override: false
EOF
:::



Apply the declaration with decK:
:::code{showCopyAction=true showLineNumbers=false language=shell}
deck gateway reset --konnect-control-plane-name kong-aws --konnect-token $PAT -f
deck gateway sync --konnect-token $PAT ai-proxy-advanced.yaml
:::

Send the request few times. Note we are going to receive responses from both LLMs, in a round-robin way.

:::code{showCopyAction=true showLineNumbers=false language=shell}
curl -s -X POST \
  --url $DATA_PLANE_LB/bedrock-route \
  --header 'Content-Type: application/json' \
  --data '{
     "messages": [
       {
         "role": "user",
         "content": "Who is considered the greatest Polish writer?"
       }
     ]
   }' | jq
:::


Here's the Llama3.3 response:
```
{
  "model": "us.meta.llama3-3-70b-instruct-v1:0",
  "usage": {
    "prompt_tokens": 43,
    "completion_tokens": 372,
    "total_tokens": 415
  },
  "object": "chat.completion",
  "choices": [
    {
      "message": {
        "content": "The question of who is considered the greatest Polish writer is subjective and can vary depending on personal opinions and literary critiques. However, one writer who is often regarded as one of the greatest Polish writers is Adam Mickiewicz (1798-1855).\n\nMickiewicz is a Polish poet, playwright, and novelist, best known for his epic poem \"Pan Tadeusz\" (1834), which is considered Poland's national epic. The poem tells the story of the Polish-Lithuanian Commonwealth and its struggle for independence against the Russian Empire.\n\nMickiewicz is also known for his other works, such as \"Dziady\" (Forefathers' Eve), a play that explores the themes of Polish identity, history, and culture. He is considered one of the most important figures in Polish literature and a key figure in the Polish Romantic movement.\n\nOther notable Polish writers who are often considered among the greatest include:\n\n* Henryk Sienkiewicz (1846-1916), a Nobel Prize-winning novelist known for his historical novels, such as \"Quo Vadis\" (1896) and \"The Teutonic Knights\" (1900).\n* Juliusz Słowacki (1809-1849), a poet and playwright who is considered one of the most important figures in Polish Romanticism.\n* Cyprian Kamil Norwid (1821-1883), a poet, playwright, and painter who is known for his innovative and expressive style.\n* Wisława Szymborska (1923-2012), a Nobel Prize-winning poet who is known for her concise and insightful poetry.\n\nOverall, while opinions may vary, Adam Mickiewicz is often regarded as one of the greatest Polish writers, and his works continue to be widely read and studied in Poland and around the world.",
        "role": "assistant"
      },
      "finish_reason": "stop",
      "index": 0
    }
  ]
}
```

And here is Amazon's Nova Micro:
```
{
  "model": "us.amazon.nova-micro-v1:0",
  "usage": {
    "prompt_tokens": 8,
    "completion_tokens": 109,
    "total_tokens": 117
  },
  "object": "chat.completion",
  "choices": [
    {
      "message": {
        "content": "The greatest Polish writer is often considered to be **Henryk Sienkiewicz**. He is best known for his historical novel \"Quo Vadis,\" which earned him the Nobel Prize in Literature in 1905. Sienkiewicz also wrote other notable works, including \"With Fire and Sword\" and \"The Deluge,\" which are part of his series known as \"The Trilogy.\" His works are celebrated for their vivid portrayal of Polish history and culture, and they continue to be widely read and appreciated both in Poland and internationally.",
        "role": "assistant"
      },
      "finish_reason": "stop",
      "index": 0
    }
  ]
}
```