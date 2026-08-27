---
title : "Prompt Engineering - Decorator"
weight : 172
---

As a simple example, let's implement a Prompt Engineering policy adding a Decorator to our Kong Gateway Service.

Choose your AI Gateway your created in the previous section:

* Inside the AI Gateway Overview page, click the **Models** tab.
* Choose the model you've just created.
* Inside the Model Oveview page, click the **Prompt engineering** option.
* You'll be able to configure two kinds of Prompt Engineering policies: **Decorators** and **Templates**
* Click the **AI Prompt Decorator**.

Inside the **AI Prompt Decorator** page:
* Type ``policy1`` for **Display Name**.
* Turn the **Prompts** toggle on.
* Click **+Add prepend**.
* Type ``You will always respond in Italian`` inside **Content**. Click **Create and next** button at the button of the page.
* Click **Done**.

![Decorator](/static/images/decorator_aigw2.png)


Send the request again and send it to the Data Plane. You should receive something like:

```
{
  "id": "chatcmpl-EHb2z1XNN7LmTRCfDYJXB6J6yfvhJ",
  "object": "chat.completion",
  "created": 1787862693,
  "model": "gpt-4o-2024-08-06",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Mi dispiace, non ho informazioni specifiche su un prodotto chiamato \"Kong AI Gateway\". Tuttavia, potrei fornirti informazioni su Kong API Gateway, se è di questo che intendevi parlare. Kong API Gateway è una piattaforma per la gestione delle API che supporta il routing, la sicurezza, il monitoraggio e la scalabilità per le applicazioni. Inoltre, offre funzionalità quali il controllo degli accessi, l'autenticazione, e il supporto per plugin per estenderne le funzionalità. Se hai ulteriori dettagli o un nome corretto, fammelo sapere in modo che possa aiutarti meglio!",
        "refusal": null,
        "annotations": []
      },
      "logprobs": null,
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 24,
    "completion_tokens": 134,
    "total_tokens": 158,
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
  "system_fingerprint": "fp_64d0f9e03c"
}
```


Click **Next** to proceed with the next module.