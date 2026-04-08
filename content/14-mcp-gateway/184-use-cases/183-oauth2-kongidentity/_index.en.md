---
title : "Implement the OAuth 2 specification for MCP servers with Kong Identity"
weight : 1830
---

### MCP Authorization

As you might have noticed, until now, there's no security mechanism defined to protect the MCP Tool exposed by the Kong AI Gateway. As usual, you can take advantage of the historical plugins the Kong API Gateway provides to implement [Authentication](https://developer.konghq.com/plugins/?category=authentication) and [Security](https://developer.konghq.com/plugins/?category=security) processes to your MCP Tool, such as Key Auth, OpenID Connect, Open Policy Agent, etc.

On the other hand, the MCP community has defined [Authorization specifications](https://modelcontextprotocol.io/specification/2025-03-26/basic/authorization), based on [OAuth 2](https://oauth.net/2) standards. To be fully compliant with the specs, the Kong AI Gateway provides a second plugin, responsible for implementing those specs: the [AI MCP OAuth2 Plugin](https://developer.konghq.com/plugins/ai-mcp-oauth2).

Kong offers [Kong Identity](https://developer.konghq.com/kong-identity/) which enables you to use Konnect to generate, authenticate, and authorize API access and MCP Tool consumption. In this module, we will configure the **AI MCP OAuth2** plugin to use Kong Identity as the external Identity Provider, which is responsible for issuing Access Tokens and validating them during the MCP Tool consuming time. The Access Token validation follows the [**OAuth2 Token Introspection**](https://oauth.net/2/token-introspection/) specification which defines a protocol that returns information about an Access Token.

### OAuth2 fundamentals

#### OAuth2 Actors

The [**OAuth2 Authorization Framework**](https://datatracker.ietf.org/doc/html/rfc6749) defines the following Actors:

* **Client**: Usually a program. The Client obtains an Access Token from the Authorization Server. In our implementation, this role is played by the **MCP Consumer**.
* **Resource Owner (RO)**: The End-User participant. Usually a user but can also be a machine/service.
* **Authorization Server (AS)**: Handles the End-User (RO) authentication, obtains consent and issues tokens with claims about the authentication event to the RP. In our implementation, this role is played by **Kong Identity**.
* **Resource Server (RS)**: The server hosting protected resources accessible with Access Tokens (e.g. an API or a web page). RS is responsbible for validating the Access Token, enforcing scopes/permissions and returning protected data. This role is played by **Kong Data Plane**. The **Kong Data Plane** validates the token through the **Token Introspection** Flow.


#### Authorization Grant

An [**Authorization Grant**](https://datatracker.ietf.org/doc/html/rfc6749#section-1.3) is a credential representing the RO's authorization (to access its protected resources) used by the client to obtain an Access Token. This specification defines four Grant Types:

* [**Authorization Code**](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1): Used in web and mobile apps involving a user. Client receives a code, then exchanges it for an Access Token.
* [**Implicit**](https://datatracker.ietf.org/doc/html/rfc6749#section-4.2): Designed for browser-based apps, discouraged due to security concerns.
* [**Resource Owner Password Credentials**](https://datatracker.ietf.org/doc/html/rfc6749#section-4.3): Largely deprecated in modern systems. Client collects user’s username/password and Access Token returned directly.
* [**Client Credentials**](https://datatracker.ietf.org/doc/html/rfc6749#section-4.4): Used for backend services and machine-to-machine communication.
	


#### The Client Credentials Grant

The use case described later is going to use the [**Client Credentials Grant**](https://datatracker.ietf.org/doc/html/rfc6749#section-4.4) which has a simple flow:

```
     +--------+                               +---------------+
     |        |--(A)----- Token Request ----->| Authorization |
     |        |                               |     Server    |
     |        |<-(B)----- Access Token -------|               |
     |        |                               +---------------+
     | Client |
     |        |                               +---------------+
     |        |--(C)----- Access Token ------>|    Resource   |
     |        |                               |     Server    |
     |        |<-(D)--- Protected Resource ---|               |
     +--------+                               +---------------+
```
* **(A)**: The Client requests an Access Token by authenticating with the Authorization Server (AS) and presenting the "Client Credentials Authorization Grant".
* **(B)**: The AS authenticates the Client and validates the Authorization Grant, and if valid, issues an Access Token.
* **(C)**: The Client requests the protected resource from the Resource Server (RS) and authenticates by presenting the Access Token.
* **(D)**: Through the Introspection Flow, the RS validates the Access Token, and, if valid, serves the request.




#### OAuth2 main concepts

* [**Access Tokens**](https://datatracker.ietf.org/doc/html/rfc6749#section-1.4) are credentials used to access protected resources. An access token is a string representing an authorization issued to the client. It can be Opaque, JWT, Random String, etc.


* [**JWT**](https://datatracker.ietf.org/doc/html/rfc7519) is a string representing a set of claims as a JSON object


* [**Claim**](https://datatracker.ietf.org/doc/html/rfc7519#section-4) is a piece of information asserted about a subject. A claim is represented as a **name/value** pair consisting of a **Claim Name** and a **Claim Value**. Typical and standardized claims defined in JWT based Access Tokens are:

  * ``iss``: it specifies the issuer of the access token
  * ``sub``: it identifies the principal that is the subject of the JWT
  * ``exp``: it identifies the expiration time
  * ``iat``: the "issued at" claim identifies the time at which the token issued
  * ``nbf``: the "not before" claim identifies the time before which the token must not be accepted
  * ``jti``: the "JWT ID" claim provides a unique identifier for the JWT. That's useful to prevent collisions when managing multiple issuers.


* [**Audience**](https://datatracker.ietf.org/doc/html/rfc7519#section-4.1.3) is a claim which defines the recipients that the tokens are intended for. It identifies the API or resource server that should accept the token. This becomes the ``‘aud’`` claim in an Access Token. If a user authenticates to access ``app1`` but attempts to use that token to access ``app2``, checking the ``aud`` claim will reject the request.


* [**Scope**](https://oauth.net/2/scope/) is a mechanism in OAuth 2 to limit an application's access to a user's account. The access token issued to the application will be limited to the scopes granted. It's not part of the JWT specification. Identity Providers, playing the Authorization Server role like Kong Identity, implement and add **scopes** to their JWT based Access Tokens using, for example:
```
{
  "iss": "https://lpjwyco0nr07jrva.us.identity.konghq.com/auth",
  "aud": [
    "http://mcp_tools.dev"
  ],
  "sub": "p4aih3vylfgl3d8a",
  "scope": "orders:read orders:write",
  "exp": 1771350984,
  "iat": 1771350924
}
```

#### Token Issuing and Validation

For the **Client Credentials Grant**, the Client sends an [**Access Token Request**](https://datatracker.ietf.org/doc/html/rfc6749#section-4.4.2) to the [**Token Endpoint**](https://datatracker.ietf.org/doc/html/rfc6749#section-3.2) (``/token``), typically exposed by the **Authorization Server**. The request may have, optionally, the **scope** the Client is interested in. If the Client has all necessary permissions to request the **scope**, then the Access Token generated will have the **scope** required. Otherwise, the Client receives a specific error.

When receiving the Access Token, the **Resource Server**, among several things, parse and evalutated the **scope** field in the Access Token to make sure the Access Token is valid and the request can be processed. For the Kong Identity implementation, we are going to use the [**OAuth2 Token Introspection**](https://oauth.net/2/token-introspection) Flow, implemented by the **AI MCP OAuth2** plugin. To validate the Access Token, the **AI MCP OAuth2** plugin sends an [**Introspection Request**](https://datatracker.ietf.org/doc/html/rfc7662#section-2.1) to the [**Introspection Endpoint**](https://datatracker.ietf.org/doc/html/rfc7662#section-2) (``/introspect``).

Obs.: As an alternative to **Introspection**, Access Tokens can be issued in a structured format that is understood by both the Authorization Server (**Kong Identity**) and the Resource Server (**Kong Data Plane**). The [**JWT Profile for OAuth 2.0 Access Tokens**](https://datatracker.ietf.org/doc/html/rfc9068) standardizes the use of JSON Web Tokens (JWTs) as Access Tokens. With this approach, the Kong Data Plane (RS) can validate the Access Token locally, by verifying its signature and evaluating its claims, without making a network call to the **Kong Identity** (AS). You can use the [**OpenID Connect**](https://developer.konghq.com/plugins/openid-connect/) plugin to implement this validation.



### Kong AI/MCP Gateway and Kong Identity Implementation

This use case implementation has the following steps:
* Create a new **Kong Identity Authorization Server**.
* Apply the new **decK** declaration to use the **AI MCP OAuth2** plugin.
* Consume the LLM and Tools with the **mcp.client.streamable_http** Python package.


The following diagram shows the relationship between the Kong AI Gateway and the Identity Provider (IdP) for the Introspection flow. It's based on the original **Protocol Flow**:

![Kong AI Gateway with Kong Identity integration](/static/images/ai_gateway_kong_identity.png)


1. The MCP Consumer, implementing the Client Credentials Grant, presents its credentials (Client ID + Client Secret) to the IdP.
1. The IdP authenticates the Consumer, issues an Access Token and returns it to the MCP Consumer.
1. The MCP Consumer sends a request to the Gateway with the Access Token injected.
1. The AI/MCP Gateway sends a request to the IdP's Introspection Endpoint to get the Access Token validated.
1. If the Token is still valid the Gateway calls the Tool.



It’s important to notice that one of the main benefits provided by an architecture like this is to follow the **Separation of Concerns** principle:
* Identity Provider: responsible for User and Application Authentication, Tokenization, MFA, multiples User Databases abstraction, etc.
* Gateway: responsible for exposing the Upstream Services, MCP Servers and GenAI models, controlling their consumption through an extensive list of policies besides Authentication including Rate Limiting, Caching, Log Processing, etc.






### OAuth and [OpenId Connect](https://openid.net)

We are going to use the **AI MCP OAuth2** plugin and the **Client Credentials Grant**, so no **ID Tokens** will be generated. However, as a clarificatiion, let's have a brief comparison between the two specs:

**OAuth** is fundamentatlly an Authorization Framework. The Access Token does not know your Identity, just that it has permissions.

On the other hand, [**OpenId Connect (OIDC)**](https://openid.net/specs/openid-connect-core-1_0-36.html) is another set of specification defining an Authentication layer on top of OAuth. In other words, OpenId Connect internally uses the same OAuth flows. Having said that, **OpenId Connect** and **ID Token** make sense for Grants where we have user involved, like the **Authorization Code Grant**. The **Client Credentials Grant**, used before, is fundamentally defined for machine-to-machine communitacation so no user identity is involved.

In this sense, OpenId Connect, adds some new concepts:

* [ID Token](https://openid.net/specs/openid-connect-core-1_0-36.html#IDToken), based on JWT
* New endpoints like, for example:
    * ["/userinfo"](https://openid.net/specs/openid-connect-core-1_0-36.html#UserInfo)
    * ["/.well-known/openid-configuration"](https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderConfig)
* New terminology:
    * **OpenID Connect Provider (OP)**: It's the Identity Provider. That's the term for the "Authorization Server". Kong Identity plays that role.
    * **Replying Party (RP)**: It's the OpenID Connect term for “client”. That's the application that trusts the **OP** and validades the ID Token. Kong Data Plane plays that role.
* Specific ["scopes" and "claims"](https://openid.net/specs/openid-connect-core-1_0-36.html#ScopeClaims) related to identities.




#### Access Tokens and ID Tokens

As an example, here a comparison between Access Tokens (defined by OAuth) and ID Token (defined by OpenId Connect)

* **Access Token**:

```
{
  "iss": "https://lpjwyco0nr07jrva.us.identity.konghq.com/auth",
  "aud": [
    "http://mcp_tools.dev"
  ],
  "sub": "p4aih3vylfgl3d8a",
  "scope": "scope1",
  "exp": 1771350984,
  "iat": 1771350924
}
```

* **ID Token**:

```
{
  "iss": "https://lpjwyco0nr07jrva.us.identity.konghq.com/auth",
  "aud": [
    "http://mcp_tools.dev"
  ],
  "sub": "p4aih3vylfgl3d8a",
  "email": "claudio.acquaviva@gmail.com",
  "email_verified": true,
  "name": "Claudio Acquaviva",
  "nonce": "n-0S6_WzA2Mj",
  "exp": 1771350984,
  "iat": 1771350924
}
```

Taking the [**Authorization Code Grant**](https://openid.net/specs/openid-connect-core-1_0-36.html#CodeFlowAuth) as an example, the Client sends an [**OpenId Connect Authentication Request**](https://openid.net/specs/openid-connect-core-1_0-36.html#AuthRequest) to the [**OAuth Authorization Endpoint**](https://openid.net/specs/openid-connect-core-1_0-36.html#AuthorizationEndpoint) (``/authorize``), with the **scope** parameter as ``openid``, and gets an **Authorization Code**. The Client then sends a request with the **Authorization Code** to the [**Token Endpoint**](https://openid.net/specs/openid-connect-core-1_0-36.html#TokenEndpoint) to get the Access Token, an ID Token, this time.


#### Scope and Claims

Also, differently to what happens to the OAuth **scopes** and **claims**, the [OpenId Connect Claims and Scopes](https://openid.net/specs/openid-connect-core-1_0-36.html#ScopeClaims) are related and play a distinct role. For example:

* The **scope** ``profile`` are related to the **claims** like ``name`` and ``birthdate`` claims. 
* The **scope** ``email`` which requests access to the ``email`` and ``email_verified`` claims.

So, as you can see, in **OpenId Connect**, the ID Token does not have a **scope** defined. In fact, when a Client sends the **OpenId Connect Authentication Request**, it includes the **scope** it is interested in. At the end of the flow, the ID Token will have the **claims** related to the **scope** required.




You can now click **Next** to proceed further.