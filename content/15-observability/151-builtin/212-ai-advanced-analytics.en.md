---
title : "Konnect AI Analytics"
weight : 2
---

**Konnect Analytics** also provides an **AI Gateway** dashboard template. It includes is specific AI-based metrics such as:

* GenAI Model Usage Count
* AI Status Code
* Token Usage Statistics by Provider
* Cost per Consumer
* GenAI total cost


### The **AI Proxy** and **AI Proxy Advanced** plugins logging configuration

In order to get the LLM metrics, we need to configure the **AI Proxy** or **AI Proxy Advanced plugins** with specific parameter. Doing so, the Data Plane will then report the Control Plane with the generated metrics and the dashboard will be updated.

For example, the **AI Proxy** plugin provide these [logging configuration](https://developer.konghq.com/plugins/ai-proxy/reference/#schema--config-logging) parameters. Same configurations are also available for the **AI Proxy Advanced** plugin.

* **log_statistics**: If enabled (and supported by the driver), will add model usage and token metrics into the Kong log plugin(s) output.
* **log_payloads**: If enabled, will log the request and response body into the Kong log plugin(s) output.


### Input and Output cost metrics

Specifically to costs, the plugin also has the following parameters. Those parameters tell the plugin how to report the Control Plane with consumption costs as well.

* **input_cost**: Defines the cost per 1M tokens in your prompt.
* **output_cost**: Defines the cost per 1M tokens in the output of the AI.




### Configure the **AI Proxy** plugin with logging

Let's review the original **AI Proxy** configuration we used before. This version has:
* ``logging`` section asking the plugin to generate LLM metrics
* ``input_cost`` and ``output_cost`` to generate cost-based metrics
* ``key-auth`` plugin and ``consumers`` section to protect the Kong Route as well as generate metrics based on Kong Consumers.

:::code{showCopyAction=true showLineNumbers=false language=shell}
cat > ai-proxy-logging.yaml << 'EOF'
_format_version: "3.0"
_konnect:
  control_plane_name: kong-aws
_info:
  select_tags:
  - bedrock
services:
- name: service1
  host: localhost
  port: 32000
  routes:
  - name: route1
    paths:
    - /bedrock-route
    plugins:
    - name: ai-proxy
      instance_name: "ai-proxy-bedrock"
      config:
        auth:
          allow_override: false
        route_type: "llm/v1/chat"
        model:
          provider: "bedrock"
          name: "us.amazon.nova-micro-v1:0"
          options:
            bedrock:
              aws_region: "us-west-2"
            input_cost: 1000
            output_cost: 3000
        logging:
            log_statistics: true
            log_payloads: true
    - name: key-auth
      instance_name: key-auth-bedrock
      enabled: true
consumers:
- keyauth_credentials:
  - key: "123456"
  username: user1
EOF
:::


Note that, this time, we've added the ``logging`` section to our declaration as well as the cost based parameters. Submit it with ``deck``:


:::code{showCopyAction=true showLineNumbers=false language=shell}
deck gateway reset --konnect-control-plane-name kong-aws --konnect-token $PAT -f
deck gateway sync --konnect-token $PAT ai-proxy-logging.yaml
:::



Now, if you consume the Route the plugin will generate metrics and the Data Plane will push them to the Control Plane.

:::code{showCopyAction=true showLineNumbers=false language=shell}
curl -s -X POST \
  --url $DATA_PLANE_LB/bedrock-route \
  --header 'Content-Type: application/json' \
  --header 'apikey: 123456' \
  --data '{
     "messages": [
       {
         "role": "user",
         "content": "what is pi?"
       }
     ]
   }' | jq
:::



### Create an AI Gateway Dashboard

Now, let's create a dashboard to see those metrics. Go to **Dashboards** inside **Observability** Konnect menu option. Click on **Create dashboard** -> **Create from template**. You should see the **Create from template** page with the **AI Gateway dashboard** option available:

![ai_dashboard_template](/static/images/ai_dashboard_template.png)


Click **Use template**. You should see your dashboard with the AI Metrics:

![ai_dashboard_template](/static/images/ai_dashboard.png)



