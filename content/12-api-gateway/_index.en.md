---
title : "Kong API Gateway"
weight : 120
---

With our Control Plane created and Data Plane layer deployed it's time to create an API and expose an application. In this module, we will:

* Deploy an application to get protected by the Data Plane
* Use **decK** to define a Kong Service based on an endpoint provided by the application and a Kong Route on top of the Kong Service to expose the application.
* Enable Kong Plugins to the Kong Route or Kong Service.
* Define Kong Consumers to represent the entities sending request to the Gateway and enable Kong Plugin to them.

With [decK](https://docs.konghq.com/deck/) (declarations for Kong) you can manage Kong Konnect configuration in a declaratively way.

decK operates on state files. decK state files describe the configuration of Kong API Gateway. State files encapsulate the complete configuration of Kong in a declarative format, including services, routes, plugins, consumers, and other entities that define how requests are processed and routed through Kong.



You can now click **Next** to begin the module.

## Optional Reading

Learn more about [Konnect Gateway Manager](https://docs.konghq.com/konnect/gateway-manager)

