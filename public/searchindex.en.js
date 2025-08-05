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
