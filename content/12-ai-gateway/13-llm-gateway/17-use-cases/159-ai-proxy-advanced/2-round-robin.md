---
title : "Round Robin"
weight : 2
---

Let's get started with a simple round-robin policy:

```
cat > ai-proxy-advanced.yaml << 'EOF'
_format_version: "3.0"
_info:
  select_tags:
  - llm
_konnect:
  control_plane_name: kong-workshop
services:
- name: ai-proxy-advanced-service
  host: localhost
  port: 32000
  routes:
  - name: route1
    paths:
    - /route1
    plugins:
    - name: ai-proxy-advanced
      instance_name: ai-proxy-advanced1
      config:
        balancer:
          algorithm: round-robin
        targets:
        - model:
            provider: openai
            name: gpt-4.1
            options:
              temperature: 1.0
          route_type: "llm/v1/chat"
          auth:
            header_name: Authorization
            header_value: Bearer ${{ env "DECK_OPENAI_API_KEY" }}
        - model:
            provider: llama2
            name: llama3.2:1b
            options:
              llama2_format: ollama
              upstream_url: http://ollama.ollama:11434/api/chat
          route_type: "llm/v1/chat"
EOF
```



Apply the declaration with decK:
```
deck gateway reset --konnect-control-plane-name kong-workshop --konnect-token $PAT -f
deck gateway sync --konnect-token $PAT ai-proxy-advanced.yaml
```

Send the request few times. Note we are going to receive responses from both LLMs, in a round-robin way.

```
curl -s -X POST \
  --url $DATA_PLANE_LB/route1 \
  --header 'Content-Type: application/json' \
  --data '{
     "messages": [
       {
         "role": "user",
         "content": "Who is considered the greatest Polish writer?"
       }
     ]
   }' | jq
```


Here's the OpenAI's gpt-4.1 response:
```
{
  "id": "chatcmpl-C3lbQFtYTrEWwq7N6zKWh4CHl3idX",
  "object": "chat.completion",
  "created": 1755014004,
  "model": "gpt-4.1-2025-04-14",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "The title of \"greatest Polish writer\" is somewhat subjective and can depend on whom you ask and which literary genre or era is in focus. However, several names consistently rise to the top in critical consensus and cultural significance:\n\n1. **Adam Mickiewicz (1798–1855):** Often considered the national poet of Poland and a key figure in Romanticism, Mickiewicz is renowned for works such as *Pan Tadeusz* and *Dziady* (Forefathers' Eve). His impact on Polish identity and literature is unparalleled.\n\n2. **Henryk Sienkiewicz (1846–1916):** Winner of the Nobel Prize for Literature in 1905, Sienkiewicz is famous for historical novels such as *Quo Vadis* and his \"Trilogy\" (*With Fire and Sword*, *The Deluge*, *Fire in the Steppe*).\n\n3. **Wisława Szymborska (1923–2012):** One of the most celebrated modern poets, Szymborska received the Nobel Prize in 1996. Her poetry is noted for its wit, irony, and philosophical depth.\n\n4. **Czesław Miłosz (1911–2004):** A Nobel Prize-winning poet (1980), essayist, and thinker, Miłosz's impact on world literature and Polish thought is immense.\n\nGiven the foundational role Adam Mickiewicz played in defining Polish literature and his enduring influence, **Mickiewicz is most frequently regarded as the greatest Polish writer, particularly in terms of cultural and historical significance**.\n\nHowever, for different periods or genres, Sienkiewicz, Szymborska, or Miłosz may be regarded as the greatest by some readers or scholars.",
        "refusal": null,
        "annotations": []
      },
      "logprobs": null,
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 15,
    "completion_tokens": 364,
    "total_tokens": 379,
    "prompt_tokens_details": {
      "cached_tokens": 0,
      "audio_tokens": 0
    },
    "completion_tokens_details": {
      "reasoning_tokens": 0,
      "audio_tokens": 0,
      "accepted_prediction_tokens": 0,
      "rejected_prediction_tokens": 0
    }
  },
  "service_tier": "default",
  "system_fingerprint": "fp_799e4ca3f1"
}
```

And here is llama3.2:1b's:
```
{
  "object": "chat.completion",
  "model": "llama3.2:1b",
  "choices": [
    {
      "index": 0,
      "finish_reason": "stop",
      "message": {
        "content": "The greatest Polish writer is often debated among scholars and literary enthusiasts. However, some of the most highly regarded Polish writers include:\n\n1. Juliusz Słowacki (1795-1861): Considered one of the greatest Polish writers, Słowacki was a poet, playwright, and translator. He is known for his lyric poetry and plays that often explored themes of love, nature, and social issues.\n2. Adam Mickiewicz (1809-1849): A leading figure in Poland's national revival movement, Mickiewicz was a poet, composer, and politician. He wrote the epic poem \"Pan Tadeusz,\" which is considered one of the greatest Polish works of literature.\n3. Józef Piłsudski (1867-1935): While not traditionally considered a writer, Piłsudski was a prominent statesman and military leader who played a key role in Poland's struggle for independence. He also wrote two literary novels, \"The Tragedy of Maksimilian\" and \"The Trial of Maximilian.\"\n4. Cyprian Kamil Norwid (1821-1883): A poet, playwright, and critic, Norwid was one of the most influential Polish writers of his time. He is known for his innovative style and exploration of themes such as love, nature, and social justice.\n5. Henryk Sienkiewicz (1846-1916): Although primarily a novelist and playwright, Sienkiewicz's works often explored themes of politics, history, and morality. His novel \"Quo Vadis\" is considered one of the greatest Polish novels of all time.\n\nHowever, if I had to choose one writer who is widely regarded as the greatest Polish writer, it would be Juliusz Słowacki.",
        "role": "assistant"
      }
    }
  ],
  "usage": {
    "completion_tokens": 370,
    "total_tokens": 403,
    "prompt_tokens": 33
  },
  "created": 1755014233
}
```