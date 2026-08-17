---
title : "Dev Portal creation and API publication"
weight : 191
---


## Basic Developer Portal implementation

In this section we are going to cover the basic steps to get a Developer Portal deployed

### Kong Service and Route

1. Create a Kong Gateway Service based on ``http://httpbin.konghq.com``.
2. Create a Kong Route with path ``/``. Don't forget to add the **HTTP** protocol to the Kong Route.
3. Globally enable the CORS plugin to your Kong Gateway Service. That's needed to solve the relationship between the Dev Portal and the Upstream Service.


### Dev Portal creation

1. Choose the **Portals** menu option inside **Dev Portal** and click **+  New portal**.
2. Create a **Private Portal** named ``portal1``. In the **New Portal** page accept the default values and click **Create and continue**
![portal1](/static/images/portal1.png)
3. In the **Customize appearance** page accept the default values and click **Save**.
![portal1_customize_appearance](/static/images/portal1_customize_appearance.png)
4. The Dev Portal is created. Click on **Go to overview**.
![portal1_overview](/static/images/portal1_overview.png)
4. Check the Portal configuration:
* **User authentication**: ``Konnect Built-in`` - That defines the default mechanism the Dev Portal uses for the user authentication. Besides the **built-in** option, it can be configured as **OIDC** or **SAML**.
* **Default authentication strategy**: ``Key-Auth`` - That defines the mechanism to control the API consumption inside the Dev Portal.

### Test your Dev Portal

1. Sign Up

If you click on the Dev Portal URL, you will play the Developer role and see your new portal home page. Since there's no developer created, click **Sing up** and register to the Portal. Type your name and use a real email since the Dev Portal will send a confirmation request to it.

![portal1_signup](/static/images/portal1_signup.png)

Check your email and click the **Confirm your email address**. Still playing the developer role, you should get redirected to the Dev Portal to define your password.

After creating the password, if you try to login, you'll receive an error message saying "Your account is disabled or pending approval". That's because, by default, the Dev Portal was created with the **Auto approved developers** option disabled, meaning the administrator has to manually approve the new developers registrations.

2. Approve the Developer registration

Getting back to the Dev Portal Administrator role, return to the **Dev Portal** menu option and the choose **Developer** tab. You can approve the new developer registration in the page:

![portal1_developer_approval](/static/images/portal1_developer_approval.png)

3. Login to the Dev Portal

Playing the Developer role again, try to login to the Dev Portal one more time. You should get redirected to the Dev Portal home page.
![portal1_no_apis](/static/images/portal1_landing_page.png)

If you scroll down you will see you don't have any API published.
![portal1_no_apis](/static/images/portal1_no_apis.png)




### API creation

1. Prepare your OpenAPI specification

Download the [httpbin_spec.yaml](/code/httpbin_spec.yaml) OpenAPI specification. From the Konnect Dev Portal perspective, the spec has two main configurations:
* The ``servers`` section. Make sure the ``url`` parameters has your Proxy URL:
```  
  - url: <YOUR_PROXY_URL>
```

* Note the spec has added specific DevPortal elements in the ``security`` & ``securitySchemes`` sections. That means the DevPortal will use the Key Auth plugin to control the API Consumption inside the Portal.
```
#################################
# Kong DevPortal Security mechanism
#################################
security:
  - ApiKeyAuth: []
#################################
```

```
components:
  securitySchemes:
#################################
# Kong Gateway Key-Auth
#################################
    ApiKeyAuth:
      type: apiKey
      in: header
      name: apikey
#################################
```


2. Create your API

Choose the **APIs** menu option inside **Catalog** and click **+ Create API**. Upload your ``httpbin_orig.yaml`` and click **Create**. You should see your ``httpbin`` API page:

![httpbin_api](/static/images/httpbin_api.png)



3. Test your API

Click the **API Specification** tab. Choose the version and click **try it!** in the **Returns Origin IP**

![tryit](/static/images/tryit.png)


4. Add a documentation

Return to the ``httpbin`` API landing page and click the **Documentation** tab. Create a new and empty document page with both name and slug as ``doc1``. Type some documentation. Click **Save** and **Publish**.


![api_documentation](/static/images/api_documentation.png)


### API Publication

1. Go back to **Portals** menu option, choose your portal and click **Published APIs** tab. Choose ``httpbin``as the API and make sure you have the **API visibility** set as ``Private``. Click **Publish API**.

You should see the ``portal1`` listed inside the tab.

![api_portal](/static/images/api_portal.png)

2. You are going to play the Developer role again. Click on the URL shown in the **Portals** tab to get redirected to the Dev Portal. Login to it, if needed.

Inside the Dev Portal home page, click the **APIs** tab. You should see the API you've just published.

![api_devportal](/static/images/api_devportal.png)

3. Click **View APIs**. You should see the documentation page with the data you entered before. Click on one of the Endpoints, e. g. ``Returns Origin IP``. Click **Try it** to send a request to the Data Plane and consume the API.

![api_devportal_return](/static/images/api_devportal_return.png)


