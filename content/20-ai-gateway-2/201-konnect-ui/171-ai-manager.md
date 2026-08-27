---
title : "AI Manager"
weight : 171
---

## Create the AI Gateway

The **AI Gateway** menu option lets you to create a new instance. Click on the option and choose **New AI Gateway** button.

Inside the **New AI Gateway** page do the following:
* Name your new AI Gateway as ``ai_gateway_1``.
* You can label the new instance if you want.
* Click **Next ->**

In the **Create AI Gateway** page choose:
* **Self-managed** to the question ``Where do you want to run your AI gateway?``
* **Docker** to question ``How do you want to run your gateway?``
* Click **Next ->**

In the next page:
* Choose your Operating System
* Click **Generate certificate and script**
* Copy the **docker** command generated.

![AI Gateway 1](/static/images/ai_gateway_1_2.png)



Go to a local terminal and run the command. Change ``docker`` to ``podman`` if you are running it. For example:

```
% podman run -d \
-e "KONG_ROLE=data_plane" \
-e "KONG_DATABASE=off" \
-e "KONG_VITALS=off" \
-e "KONG_CLUSTER_MTLS=pki" \
-e "KONG_CLUSTER_CONTROL_PLANE=123123.us.cp.konghq.com:443" \
-e "KONG_CLUSTER_SERVER_NAME=123123.us.cp.konghq.com" \
-e "KONG_CLUSTER_TELEMETRY_ENDPOINT=123123.us.tp.konghq.com:443" \
-e "KONG_CLUSTER_TELEMETRY_SERVER_NAME=123123.us.tp.konghq.com" \
-e "KONG_CLUSTER_CERT=-----BEGIN CERTIFICATE-----
XXX
YYY
ZZZ
-----END CERTIFICATE-----" \
-e "KONG_CLUSTER_CERT_KEY=-----BEGIN PRIVATE KEY-----
AAA
BBB
CCC
-----END PRIVATE KEY-----" \
-e "KONG_LUA_SSL_TRUSTED_CERTIFICATE=system" \
-e "KONG_KONNECT_MODE=on" \
-p 8000:8000 \
-p 8443:8443 \
kong/kong-ai-gateway:2.0.2
Resolving "kong/kong-ai-gateway" using unqualified-search registries (/usr/share/containers/registries.conf.d/999-podman-machine.conf)
Trying to pull docker.io/kong/kong-ai-gateway:2.0.2...
Getting image source signatures
Copying blob sha256:c70f62147103746a6c7c146336a1527da237b1503d9dab67fbb1f9990551f697
Copying blob sha256:d23996caa910b8e5029375ee7c7ec02ef8bae3d85194897323e7145071299ac9
Copying blob sha256:5b6c355c1b21cfafd90ef58021ec76d89e2750ba30e9a31de729f2534e693014
Copying config sha256:0f67dd0200dd8838b7cc312e89dd41330ded2eff82ed5d12a853ee7b84175850
Writing manifest to image destination
062fc72c7e41f3d60dc1649e07e1e10322ad764f59ac646012029be9d321ffea
```


Go back to **AI Manager**. You should see the **View gateway** button available. Click on it. You should see your new **AI Gateway Overview** page.

![AI Gateway 1](/static/images/ai_gateway_1_2_control_plane.png)


## Connect LLM

Inside the **Ovesrview** page click **Add a model** and do the following:
* Type ``model1`` for **Display name**.
* Inside the **Provider** popup box click **Add provider**.

Inside the **Add Provider**:
* Type ``provider1``for **Display name**.
* Choose ``OpenAI`` for **Provider**
* Type ``Authorization`` for **Header name**
* Type ``Bearer <YOUR_OPENAI_API_KEY>`` for **Header value**.
* Click **Create**.

![OpenAI Config](/static/images/openai_config_aigw2.png)

* Inside the **Target model** popup box, choose an OpenAI mode, e.g., ``gpt-4o``.
* Leave all other fields with the default values.
* Click **Create** at the button of the page.

![OpenAI Model and Provider](/static/images/openai_model_provider_aigw2.png)

You should see your new **Model** configured

![OpenAI Model](/static/images/openai_model_aigw2.png)


## Consume the AI Gateway

For now, we are not going to apply any AI based plugin so, inside the **Overview** page, click the **curl** command inside the **Test** box.

Got to your terminal and paste it. Add the ``-k`` option to tell **curl** to not verify the digital certificate and change ``<YOUR_DP_HOST>>`` by ``localhost``, where you Data Plane is running.


```
curl -kX POST "https://localhost:8443/chat/completions" \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer <YOUR_API_KEY>' \
-d '{
  "model": "model1",
  "messages": [
    {
      "role": "user",
      "content": "How does Kong AI Gateway work?"
    }
  ]
}'
```


You should see a response like this:
```
{
  "id": "chatcmpl-EHancmYKk7WKcPwuE8Z53r7Hdp1M6",
  "object": "chat.completion",
  "created": 1787861740,
  "model": "gpt-4o-2024-08-06",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Kong AI Gateway is a platform that automates API management by leveraging artificial intelligence and machine learning technologies. It enhances traditional API gateways by providing advanced features for monitoring, securing, and optimizing API traffic. Here's a basic overview of how it works:\n\n1. **API Management**: Kong AI Gateway allows users to manage APIs more efficiently through automated tools for routing, authentication, and request transformation. The AI components can help optimize these processes by suggesting rules or detecting anomalies.\n\n2. **Intelligent Traffic Control**: The platform can analyze traffic patterns in real-time to predict and respond to changes, optimizing both the performance and the reliability of APIs. It can automatically adjust load balancing and throttling policies based on current and predicted demand.\n\n3. **Security Enhancements**: By using machine learning, Kong AI Gateway can identify unusual patterns indicating potential security threats, thus enabling early and more accurate detection of attacks, like DDoS or attempts to exploit vulnerabilities.\n\n4. **Monitoring and Analytics**: The integration of AI with analytics allows for more insightful monitoring of API usage. It provides deep insights into performance metrics and can suggest improvements or predict future trends.\n\n5. **Adaptability and Learning**: Over time, the AI elements of the gateway learn from API interactions, helping to optimize routing and resource allocation. This can lead to lower latency and more efficient infrastructure usage.\n\n6. **Automated Configuration**: By analyzing the current API ecosystem, Kong AI Gateway can propose configuration changes or automate certain processes to improve system performance.\n\n7. **Developer Experience**: The gateway often comes with features that streamline the developer experience, such as automated documentation updates and simplified API versioning.\n\nKong AI Gateway overall aims to reduce the manual workload associated with managing complex API environments, while improving performance, security, and scalability through intelligent automation.",
        "refusal": null,
        "annotations": []
      },
      "logprobs": null,
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 14,
    "completion_tokens": 363,
    "total_tokens": 377,
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
  "system_fingerprint": "fp_f73b165a23"
}

```



Click **Next** to proceed with the next module.

