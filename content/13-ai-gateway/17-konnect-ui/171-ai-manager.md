---
title : "AI Manager"
weight : 171
---

### Create the AI Gateway

The **AI Gateway** menu option lets you to expose an existing LLM. Click on the option and choose **Start from scratch** option inside the **New AI Gateway** button.

Inside the **New AI Gateway** page do the following:
* Name your new AI Gateway as ``ai_gateway_1``.
* Every AI Gateway has to be related to an existing Control Plane, so, for the **Select gateway** box, choose your ``kong-workshop`` Control Plane.
* Define a basic Route with ``/openai-route`` as its Path.
* Keep all other parameter with their default values and click **Save**

![AI Gateway 1](/static/images/ai_gateway_1.png)

### Connect LLM

Inside the **Overview** page click **Connect LLM*** and do the following:
* For the **Connect to LLM** popup box leave the **LLM Provider** box with its default values, ``OpenAI``. Open the box if you want to check all LLMs supported by Kong AI Gateway.
* We are going to expose the OpenAI's **gpt-4** model, so, for the **Enter a model** box, also leave its default value.
* Finally, for the **API Key** box, paste your OpenAI's API Key. Note you can store you API Key in you vault and leverage the [vault support](https://developer.konghq.com/gateway/entities/vault/) provided by Konnect. Click **Save**.


![OpenAI Config](/static/images/openai_config.png)


You should get redirected to the **Overview** with the new AI Gateway configured:

![AI Gateway Overview](/static/images/ai_gateway_overview.png)



### Consume the AI Gateway

For now, we are not going to apply any AI based plugin so, inside the **Overview** page, click **Test your setup**.

![Test your setup](/static/images/ai_gateway_test_your_setup.png)

Use the **Copy** button to copy the request, paste it into your terminal changing ``<YOUR_HOST_NAME>>`` with your ``DATA_PLANE_URL`` environment variable and send it to your Data Plane:


```
curl -X POST $DATA_PLANE_LB/openai-route \
-H 'Content-Type: application/json' \
-d '{
  "messages": [
    {
      "role": "user",
      "content": "How does Kong AI Gateway work?"
    }
  ]
}'
```


### Behind the scenes

The AI Gateway Konnect UI is the easiest way to configure your Control Plane with new AI Gateway and plugins. Behind the scenes, Konnect creates all Kong Objects required to implement the AI Gateway. For example, if you get back to your **API Gateway** menu option, you'll see you have three Kong Object defined:
* Kong Gateway Service
* Kong Route, with the your Route configuration, including the ``/openai-route`` path.
* Kong Plugin with the **Kong AI Proxy Advanced** plugin with the necessary configuration to hit OpenAI and consume its ``gpt-4`` model.

For example, here's your **Kong AI Proxy Advanced** configuration page:

![AI Proxy Advanced](/static/images/ui_ai_proxy_advanced.png)

That means you can use the same mechanisms you did for the API Gateway plugins, including the same Konnect UI and decK declarations, to configure the AI based plugins.


We are going to explore the **AI Proxy** and **AI Proxy Advanced** and other AI based plugins in the next sections.


Click **Next** to proceed with the next module.

