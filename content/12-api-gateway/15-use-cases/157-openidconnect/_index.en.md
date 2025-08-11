---
title : "OpenID Connect"
weight : 157
---

For advanced and enterprise class requirements, OpenID Connect (OIDC) is the preferred option to implement API consumer Authentication. OIDC also provides mechanisms to implement Authorization. In fact, when applying OIDC to secure the APIs, we’re delegating the Authentication process to the external Identity Provider entity.

[OpenID Connect](https://openid.net/connect) is an authentication protocol built on top of [OAuth 2.0](https://oauth.net/2) and [JWT - JSON Web Token](https://www.rfc-editor.org/rfc/rfc7519.html) to add login and profile information about the identity who is logged in.

OAuth 2.0 defines grant types for different use cases. The most common ones are:
* [Authorization Code](https://oauth.net/2/grant-types/authorization-code): for apps running on a web server, browser-based and mobile apps for user authentication.
* [Client Credentials](https://oauth.net/2/grant-types/client-credentials): for application authentication.
* [PKCE - Proof Key for Code Exchange](https://oauth.net/2/pkce): an extension to the Authorization Code grant. Recommended for SPA or native applications, PKCE acts like a non hard-coded secret.


### OpenId Connect plugin

Konnect provides an [OIDC plugin](https://docs.konghq.com/hub/kong-inc/openid-connect/) that fully supports the OAuth 2.0 grants. The plugin allows the integration with a 3rd party identity provider (IdP) in a standardized way. This plugin can be used to implement Kong as a (proxying) [OAuth 2.0](https://tools.ietf.org/html/rfc6749) resource server (RS) and/or as an OpenID Connect relying party (RP) between the client, and the upstream service.

As an example, here’s the typical topology and the Authorization Code with PKCE grant:

![pkce](/static/images/pkce.png)

1. Consumer sends a request to Kong Data Plane.
2. Since the API is being protected with the OIDC plugin, the Data Plane redirects the consumer to the IdP. Consumer provides credentials to the Identity Provide (IdP).
3. IdP authenticates the consumer enforcing security policies previously defined. The policies might involve several database technologies (e.g. LDAP, etc.), MFA (Multi-Fact Authentication), etc.
4. After user authentication, IdP redirects the consumer back to the Data Plane with the Authorization Code injected inside the request.
5. Data Plane sends a request to the IdP’s token endpoint with the Authorization Code and gets an Access Token from the IdP.
6. Data Plane routes the request to the upstream service along with the Access Token

Once again, it’s important to notice that one of the main benefits provided by an architecture like this is to follow the Separation of Concerns principle:
* Identity Provider: responsible for User and Application Authentication, Tokenization, MFA, multiples User Databases abstraction, etc.
* API Gateway: responsible for exposing the Upstream Services and controlling their consumption through an extensive list of policies besides Authentication including Rate Limiting, Caching, Log Processing, etc.




In this module, we will configure this plugin to use [Keycloak](https://www.keycloak.org/).








You can now click **Next** to proceed further.