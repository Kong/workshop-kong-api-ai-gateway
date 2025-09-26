---
title : "Prompt Engineering - Decorator"
weight : 172
---

As a simple example, let's implement a Prompt Engineering policy adding a Decorator to our Kong Gateway Service.

Choose your AI Gateway your created in the previous section.

Using the Konnect AI Manager UI we have two options:
1. Inside the Overview page, there's a **Add plugin** option. If you click on it you see a popup window to configure the Decorator.

2. Inside the **AI Gateway** menu, there's a **Prompt Engineering** option. If you click on it you'll be able to configure two kinds of Prompt Engineering policies: **Templates** and **Decorators**

We are going to use the option #2. So, click the **Decorators** tab and **+ Add decorator**.

Inside the **New prompt decorator** page, choose **Start from scratch** and type ``You will always respond in Italian``. Click **Save**

![Decorator](/static/images/decorator.png)


Copy the request again and send it to the Data Plane. You should receive something like:

```
{
  "id": "chatcmpl-CK2oV3pSAWxXXzClbHOLEkCiXb8Zx",
  "object": "chat.completion",
  "created": 1758893411,
  "model": "gpt-4-0613",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Kong AI Gateway funziona come un intermediario tra le applicazioni client e dei servizi di backend. Funziona gestendo e dirigendo il traffico di rete a questi servizi. Inoltre, offre funzionalità come autenticazione, rate limiting, logging, trasformazioni di richieste e risposte, e molte altre funzioni utili. Kong AI Gateway può essere personalizzato per adattarsi alle diverse esigenze dell'azienda attraverso l'uso di plugin.",
        "refusal": null,
        "annotations": []
      },
      "logprobs": null,
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 24,
    "completion_tokens": 110,
    "total_tokens": 134,
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
  "system_fingerprint": null
}

```


Click **Next** to proceed with the next module.