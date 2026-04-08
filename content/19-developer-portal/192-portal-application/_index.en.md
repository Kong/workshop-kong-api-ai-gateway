---
title : "Developer Self-Service and Application Registration"
weight : 152
---

This section will explore the [**Developer self-service and App registration**](https://developer.konghq.com/dev-portal/self-service/) capabilities provided by Konnect Developer Portal.

So far, you have your API published in the portal. However, there's no control over the API consumption. Konnect Dev Portal provides flexible options for controlling access to content and APIs. When combined with a Gateway Service, developers visiting a Dev Portal can sign up, create an application, register it with an API, and retrieve API keys without intervention from Dev Portal administrators.

Developer self-service consists of two main components:

* User authentication: Allows users to access your Dev Portal by logging in. You can further customize what logged in users can see using RBAC.
* Application registration: Allows developers to use your APIs using credentials and create applications for them.



### Link the API to your Gateway Service.

When you link a service with an API, Konnect automatically adds the Konnect Application Auth (KAA) plugin on that Service. The KAA plugin is responsible for applying authentication and authorization on the Service. The authentication strategy that you select for the API defines how clients authenticate. After linking to the Konnect Gateway Service, developers can create applications and generate credentials, e.g. API keys.

Play the Administrator role again and click on **APIs** inside the **Dev Portal** menu option. Choose your API. Click in the **Gateway Service** tab and link the API to your Kong Gateway Service, created in the ``kong-workshop`` Control Plane.

![link_gateway_service](/static/images/link_gateway_service.png)

As a developer, if you try to consume the API from the Dev Portal you are going to get a ``401`` error code, meaning the Dev Portal is controlling the Authentication mechanism which is, by default, based on API Keys.

![401_dev_portal](/static/images/401_dev_portal.png)


### Turn RBAC on in your Portal

In order to control the API consumption we are going to turn the RBAC security model in our portal. That will allow to define which developer can consume the API.

1. As an administrator, click the **Access and approvals** menu option inside your Dev Portal. Click on the **Teams** tab and create a team, named ``team1``.

2. Inside your team, click **Add developer** and add your developer to your team.

3. Go to the **APIs** tab and click **+ Add role**. Choose your API and add the ``API Conusumer`` role.

That means your team has only one developer who has permissions to consumer your API.

![team_dev_portal](/static/images/team_dev_portal.png)

4. As a developer, if you try to consume the API again, you will still get the ``401`` error code.


### Create a Portal Application.

1. Play the developer role again. Inside the API page, click “Use this API” and create an application, named ``app1`` (the Auth strategy is the default - API Key Auth). Click **Create and use API**.

![app_dev_portal](/static/images/app_dev_portal.png)


2. Copy the Credential (e.g. vuOeFHUiR9oSc2fDLRvJDrJvd8ZLJJbh) and click **Copy and close**

![credential_dev_portal](/static/images/credential_dev_portal.png)


3. Add your API Key in the Authentication box. You will still get the ``401`` error code if you try to consume the API again.



### Approve the Application

1. As the administrator get back to the **Access and approvals** menu option inside your portal. Click the **App Registration** tab and approve the application.

![app_approval_dev_portal](/static/images/app_approval_dev_portal.png)

2. As the developer, you should be finally able to consume the API inside the Dev Portal.

![app_consumption_dev_portal](/static/images/app_consumption_dev_portal.png)


### Check your Application

1. Still as the developer you can check your applications through the self-services provided by the Konnect Dev Portal. Click on the user icon on the top right corner of the Dev Portal page.

2. You should see the applications you've created. In our case, there's only one, ``app1``.

![app_self_service](/static/images/app_self_service.png)

3. Click on the application. You will see three tabs avaiable. The first one, **APIs**, you can see all APIs defined for the application. In our case, only the ``httpbin`` API has been used.

4. The second tab, **Analytics**, provides observability data related to the API consumption.

5. The third tab, **Credentials**, you can manage your credentials, e.g. delete the existing ones, issue new ones, etc.






## Key Takeaways

- The Konnect Dev Portal enables you to publish, document, and manage APIs for internal, partner, or public consumption.
- APIs can be published to the Dev Portal with OpenAPI/AsyncAPI specs and Markdown documentation, and linked to Gateway Services for authentication and self-service.
- Developers can self-register, create applications, and generate credentials directly from the Dev Portal.
- All of these actions can be performed via the Konnect UI, providing a user-friendly, centralized management experience for your API ecosystem.


## Next Steps

- Explore advanced Dev Portal customization options (branding, custom pages, and layouts).
- Review analytics for your APIs and API Products in Konnect.
- Learn about automating API and Dev Portal management using Konnect APIs or Terraform.


**References:**
- [Konnect Dev Portal Overview](https://developer.konghq.com/dev-portal/#dev-portal)
- [Publish your API to Dev Portal](https://developer.konghq.com/dev-portal/apis/#publish-your-api-to-dev-portal)
- [Automate your API catalog with Dev Portal](https://developer.konghq.com/how-to/automate-api-catalog/)
- [Developer Self-Service and App Registration](https://developer.konghq.com/dev-portal/self-service/)

