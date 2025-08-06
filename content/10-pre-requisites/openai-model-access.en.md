---
title: "OpenAI model access"
weight: 105
---

Access to Amazon Bedrock foundation models isn't granted by default. In order to gain access to the foundational model, follow the steps below.

:::alert{header="Model providers" type="info"}
As part of this workshop we will utilize model provider from Amazon, Anthropic, and Cohere. Access to Amazon Titan model is available by default. Access to model in different AWS regions may vary, please refer to the [model support by AWS region](https://docs.aws.amazon.com/bedrock/latest/userguide/models-regions.html).
:::

1. From the AWS console, navigate to [Amazon Bedrock](https://us-west-2.console.aws.amazon.com/bedrock/home?region=us-west-2#/modelaccess).

2. Select **Enable specific models**.

:::alert{header="Specific Model" type="warning"}
Please note, during a hosted event such as re\:Invent, Kubecon, Immersion Day, or any other event hosted by AWS or Kong, where are provided with temporary AWS account, you are limited to subscribing to 5 third-party models at most. **Do NOT select "Enable all models"** as it may result in termination of the AWS accounts that you are using during these events.
:::

3. Choose the following models:
   * Amazon:
      * Nova Lite - amazon.nova-lite-v1:0
      * Nova Micro - amazon.nova-micro-v1:0
      * Titan Text Embeddings V2 - amazon.titan-embed-text-v2:0
   * Meta:
      * Llama 3.3 70B Instruct v1 - meta.llama3-3-70b-instruct-v1:0


4. Select **Next** to review and then **Submit**.

5. Model access should take affect momentarily, you can verify it by looking at the **Access status** column.




You should see your models inside **Model Catalog**.
![MultiLine Commands](/static/images/bedrock/bedrock_model_access.png)


This wraps up the model access configuration, in the next section you will learn how to use these models in the application.
