var relearn_searchindex = [
  {
    "breadcrumb": "API Management with Kong Konnect",
    "content": "The Kong Konnect platform provides a cloud control plane (CP), which manages all service configurations. It propagates those configurations to all Runtime control planes, which use in-memory storage. These nodes can be installed anywhere, on-premise or in AWS.\nFor today workshop, we will be focusing on Kong Gateway. Kong Gateway data plane listen for traffic on the proxy port 443 by default. The data plane evaluates incoming client API requests and routes them to the appropriate backend APIs. While routing requests and providing responses, policies can be applied with plugins as necessary.\nKonnect modules Kong Konnect Enterprise features are described in this section, including modules and plugins that extend and enhance the functionality of the Kong Konnect platform.\nControl Plane (Gateway Manager) Control Plane empowers your teams to securely collaborate and manage their own set of runtimes and services without the risk of impacting other teams and projects. Control Plane instantly provisions hosted Kong Gateway control planes and supports securely attaching Kong Gateway data planes from your cloud or hybrid environments.\nThrough the Control Plane, increase the security of your APIs with out-of-the-box enterprise and community plugins, including OpenID Connect, Open Policy Agent, Mutual TLS, and more.\nDev Portal Streamline developer onboarding with the Dev Portal, which offers a self-service developer experience to discover, register, and consume published services from your Service Hub catalog. This customizable experience can be used to match your own unique branding and highlights the documentation and interactive API specifications of your services. Enable application registration to automatically secure your APIs with a variety of authorization providers.\nAnalytics Use Analytics to gain deep insights into service, route, and application usage and health monitoring data. Keep your finger on the pulse of the health of your API products with custom reports and contextual dashboards. In addition, you can enhance the native monitoring and analytics capabilities with Kong Gateway plugins that enable streaming monitoring metrics to third-party analytics providers.\nTeams To help secure and govern your environment, Konnect provides the ability to manage authorization with teams. You can use Konnect’s predefined teams for a standard set of roles, or create custom teams with any roles you choose. Invite users and add them to these teams to manage user access. You can also map groups from your existing identity provider into Konnect teams.\nFurther Reading Gateway Manager Dev Portal Analytics asdad",
    "description": "The Kong Konnect platform provides a cloud control plane (CP), which manages all service configurations. It propagates those configurations to all Runtime control planes, which use in-memory storage. These nodes can be installed anywhere, on-premise or in AWS.\nFor today workshop, we will be focusing on Kong Gateway. Kong Gateway data plane listen for traffic on the proxy port 443 by default. The data plane evaluates incoming client API requests and routes them to the appropriate backend APIs. While routing requests and providing responses, policies can be applied with plugins as necessary.",
    "tags": [],
    "title": "Kong Konnect Architectural Overview",
    "uri": "/architecture/index.html"
  },
  {
    "breadcrumb": "API Management with Kong Konnect",
    "content": "This chapter will walk you through the pre-requisites.\nKong Konnect Subscription You will need a Kong Konnect Subscription to execute this workshop.\nIf you want to check the Konnect Pricing and Plans, please, redirect to https://konghq.com/pricing\nCommand Line Utilities In this workshop, we will use the following command line utilities\nkubectl (we will install this in subsequent section) curl (pre-installed) jq (we will install this in subsequent section)",
    "description": "This chapter will walk you through the pre-requisites.\nKong Konnect Subscription You will need a Kong Konnect Subscription to execute this workshop.\nIf you want to check the Konnect Pricing and Plans, please, redirect to https://konghq.com/pricing\nCommand Line Utilities In this workshop, we will use the following command line utilities\nkubectl (we will install this in subsequent section) curl (pre-installed) jq (we will install this in subsequent section)",
    "tags": [],
    "title": "Pre-Requisites",
    "uri": "/10-pre-requisites/index.html"
  },
  {
    "breadcrumb": "API Management with Kong Konnect \u003e Pre-Requisites",
    "content": "Konnect Plus Subscription You will need a Konnect subscription. Follow the steps below to obtain a Konnect Plus subscription. Initially $500 of credits are provided for up to 30 days, after the credits have expired or the time has finished Konnect Plus will charge based on Konnect Plus pricing. Following the workshop instructions will use less than $500 credits. After the workshop has finished the Konnect Plus environment can be deleted.\nClick on the Registration link and present your credentials.\nKonnect will send you an email to confirm the subscription. Click on the link in email to confirm your subscription.\nThe Konnect environment can be accessed via the Konnect log in page.\nAfter logging in create an organisation name, select a region, then answer a few questions.\nCredit available can be monitored though Plan and Usage page.",
    "description": "Konnect Plus Subscription You will need a Konnect subscription. Follow the steps below to obtain a Konnect Plus subscription. Initially $500 of credits are provided for up to 30 days, after the credits have expired or the time has finished Konnect Plus will charge based on Konnect Plus pricing. Following the workshop instructions will use less than $500 credits. After the workshop has finished the Konnect Plus environment can be deleted.",
    "tags": [],
    "title": "Konnect Subscription",
    "uri": "/10-pre-requisites/konnect-control-plane/index.html"
  },
  {
    "breadcrumb": "API Management with Kong Konnect \u003e Pre-Requisites",
    "content": "Access to Amazon Bedrock foundation models isn’t granted by default. In order to gain access to the foundational model, follow the steps below.\n:::alert{header=“Model providers” type=“info”} As part of this workshop we will utilize model provider from Amazon, Anthropic, and Cohere. Access to Amazon Titan model is available by default. Access to model in different AWS regions may vary, please refer to the model support by AWS region. :::\nFrom the AWS console, navigate to Amazon Bedrock.\nSelect Enable specific models.\n:::alert{header=“Specific Model” type=“warning”} Please note, during a hosted event such as re:Invent, Kubecon, Immersion Day, or any other event hosted by AWS or Kong, where are provided with temporary AWS account, you are limited to subscribing to 5 third-party models at most. Do NOT select “Enable all models” as it may result in termination of the AWS accounts that you are using during these events. :::\nChoose the following models:\nAmazon: Nova Lite - amazon.nova-lite-v1:0 Nova Micro - amazon.nova-micro-v1:0 Titan Text Embeddings V2 - amazon.titan-embed-text-v2:0 Meta: Llama 3.3 70B Instruct v1 - meta.llama3-3-70b-instruct-v1:0 Select Next to review and then Submit.\nModel access should take affect momentarily, you can verify it by looking at the Access status column.\nYou should see your models inside Model Catalog. This wraps up the model access configuration, in the next section you will learn how to use these models in the application.",
    "description": "Access to Amazon Bedrock foundation models isn’t granted by default. In order to gain access to the foundational model, follow the steps below.\n:::alert{header=“Model providers” type=“info”} As part of this workshop we will utilize model provider from Amazon, Anthropic, and Cohere. Access to Amazon Titan model is available by default. Access to model in different AWS regions may vary, please refer to the model support by AWS region. :::\nFrom the AWS console, navigate to Amazon Bedrock.",
    "tags": [],
    "title": "Amazon Bedrock model access",
    "uri": "/10-pre-requisites/bedrock-model-access/index.html"
  },
  {
    "breadcrumb": "",
    "content": "Introduction Kong Konnect is an API lifecycle management platform delivered as a service. The management plane is hosted in the cloud by Kong, while the runtime environments are deployed in your AWS accounts. Management plane enables customers to securely execute API management activities such as create API routes, define services etc. Runtime environments connect with the management plane using mutual transport layer authentication (mTLS), receive the updates and take customer facing API traffic.\nLearning Objectives In this workshop, you will:\nGet an architectural overview of Kong Konnect platform. Set up Konnect runtime on Amazon Elastic Kubernetes Service (EKS). Learn what are services, routes and plugin. Deploy a sample microservice and access the application using the defined route. Use the platform to address the following API Gateway use cases Authentication and Authorization Rate limiting Response Transformer Proxy caching And the following AI Gateway use cases Prompt Engineering LLM-based Request and Reponse transformation Semantic Caching Token-based Rate Limiting Semantic Routing RAG - Retrieval-Augmented Generation Expected Duration Pre-Requisite Environment Setup (20 minutes) Architectural Walkthrough (10 minutes) Sample Application and addressing the use cases (60 minutes) Next Steps and Cleanup (5 min) :::alert{header=“Important” type=“warning”}\nRunning this workshop in your own AWS account will incur ~ $1 per hour charges. Please ensure to cleanup, once you fulfill your learning objectives.",
    "description": "Introduction Kong Konnect is an API lifecycle management platform delivered as a service. The management plane is hosted in the cloud by Kong, while the runtime environments are deployed in your AWS accounts. Management plane enables customers to securely execute API management activities such as create API routes, define services etc. Runtime environments connect with the management plane using mutual transport layer authentication (mTLS), receive the updates and take customer facing API traffic.",
    "tags": [],
    "title": "API Management with Kong Konnect",
    "uri": "/index.html"
  },
  {
    "breadcrumb": "API Management with Kong Konnect",
    "content": "",
    "description": "",
    "tags": [],
    "title": "Categories",
    "uri": "/categories/index.html"
  },
  {
    "breadcrumb": "API Management with Kong Konnect",
    "content": "",
    "description": "",
    "tags": [],
    "title": "Tags",
    "uri": "/tags/index.html"
  }
]
