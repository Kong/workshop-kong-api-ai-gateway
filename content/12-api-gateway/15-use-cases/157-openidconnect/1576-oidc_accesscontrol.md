---
title : "Authorization"
weight : 1576
---

So far, we have used the OpenID Connect plugin to implement Authentication processes only.


* The aud (Audience) claim comes from the JWT specification in [RFC 7519]. It allows the receiving party to verify whether a given JWT was intended for them. Per the specification, the aud value can be a single string or an array of strings.

aud - Identifies the audience (resource URI or server) that this access token is intended for.


* The scope claim originates from the OAuth 2.0 specification in [RFC 6749]. It defines the range of access granted by an access token, limiting it to specific claims or user data. For example, you might not want a third-party client to query any arbitrary resource using an OAuth 2.0 access token. Instead, the scope claim restricts the token’s permissions to a predefined set of resources or operations.

scp - Array of scopes that are granted to this access token.

The OpenID Connect plugin supports some [coarse-grained authorization](https://developer.konghq.com/plugins/openid-connect/#authorization) mechanisms:
* Claims-based authorization
* ACL plugin authorization
* Consumer authorization

This section is going to show how to use the plugin to implement an Authorization mechanism based on the [OAuth Scopes](https://oauth.net/2/scope/).

**OAuth Scopes** allow us to limit access to an Access Token. The configuration gets started, including a new setting to our OpenId Connect plugin: "audience_required". The following configuration defines that the Kong Route can be consumed by requests that have Access Tokens with the "aud" field set as "gold". This is a nice option to implement, for instance, Kong Konnect consumer classes.




#### Installing OpenID Connect Plugin

{{<highlight>}}
cat > oidc.yaml << 'EOF'
_format_version: "3.0"
_konnect:
  control_plane_name: kong-workshop
_info:
  select_tags:
  - httpbin-service-route
services:
- name: httpbin-service
  host: httpbin.kong.svc.cluster.local
  port: 8000
  routes:
  - name: oidc-route
    paths:
    - /oidc-route
    plugins:
    - name: openid-connect
      instance_name: openid-connect1
      config:
        auth_methods: ["client_credentials"]
        issuer: http://keycloak.keycloak:8080/realms/kong
        token_endpoint: http://keycloak.keycloak:8080/realms/kong/protocol/openid-connect/token
        extra_jwks_uris: ["http://keycloak.keycloak.svc.cluster.local:8080/realms/kong/protocol/openid-connect/certs"]
        consumer_optional: false
        consumer_claim: ["client_id"]
        consumer_by: ["username"]
        audience_required: ["gold"]
consumers:
- username: kong_id
EOF
{{</highlight>}}

Submit the declaration
{{<highlight>}}
deck gateway sync --konnect-token $PAT oidc.yaml
{{</highlight>}}



If we try to consume the Kong Route we are going to get an new error:

```
curl -iX GET http://localhost/oidc-route/get -u "kong_id:RVXO9SOJskjw4LeVupjRbIMJIAyyil8j"
```

```
HTTP/1.1 403 Forbidden
Date: Mon, 11 Aug 2025 20:39:14 GMT
Content-Type: application/json; charset=utf-8
Connection: keep-alive
WWW-Authenticate: Bearer realm="keycloak.keycloak", error="insufficient_scope"
Content-Length: 23
X-Kong-Response-Latency: 38
Server: kong/3.11.0.2-enterprise-edition
X-Kong-Request-Id: 19afd85ac97a9657b4920a3f69c8783e

{"message":"Forbidden"}
```

Note that the response describes the reason why we cannot consume the Route.

#### Create the Keycloak Client Scope
1. The first thing to do is to create a Client Scope in Keycloak. Go to the **kong** realm and click the **Client scopes** option in the left menu. Name the Client Scope as ``kong_scope`` and click "Save".

2. Click the **Mappers** tab now and choose **Configure a new mapper**. Choose **Audience** and name it as ``kong_mapper``. For the **Included Custom Audience** field type ``gold``, which is the audience the plugin has been configured. Click Save.

3. Now click on the **Clients** option in the left menu and choose our ``kong_id`` client. Client the **Client scopes** tab and add the new ``kong_scope`` we just created it as ``Default``:

4. As you can see in our previous requests, Keycloak adds, by default, the ``account`` audience as ``aud``: ``account`` field inside the Access Token. One last optional step is to remove it, so the token should have our "gold" audience only. To do that, click the default ``<client_id>-dedicated`` Client Scope (in our case, ``kong_id-dedicated``) and its Scope tab. Inside the **Scope** tab, turn the "Full scope allowed" option off.


#### Test the Keycloak Endpoint
Send a request to Keycloak again to test the new configuration:

```
curl -s -X POST 'http://localhost:8080/realms/kong/protocol/openid-connect/token' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'client_id=kong_id' \
--data-urlencode 'client_secret=RVXO9SOJskjw4LeVupjRbIMJIAyyil8j' \
--data-urlencode 'grant_type=client_credentials' | jq -r '.access_token' | jwt decode - | grep aud
```

Expected output
```
  "aud": "gold",
```


#### Consume the Kong Route again
You should be able to consumer the Kong Route now.

```
curl -sX GET http://localhost:80/oidc-route/get -u "kong_id:RVXO9SOJskjw4LeVupjRbIMJIAyyil8j"| jq -r '.headers.Authorization' | cut -d " " -f 2 | jwt decode -
```

Expected output
```
Token header
------------
{
  "typ": "JWT",
  "alg": "RS256",
  "kid": "JIao4TIXpSwJxcukz6W0hK8qc_vuYf6HrmGsDmT6kzY"
}

Token claims
------------
{
  "acr": "1",
  "allowed-origins": [
    "/*"
  ],
  "aud": "gold",
  "azp": "kong_id",
  "clientAddress": "10.244.0.106",
  "clientHost": "10.244.0.106",
  "client_id": "kong_id",
  "email_verified": false,
  "exp": 1754945838,
  "iat": 1754945538,
  "iss": "http://keycloak.keycloak:8080/realms/kong",
  "jti": "trrtcc:332fad95-49bc-f8c7-7f1b-e4ef7d7b0973",
  "preferred_username": "service-account-kong_id",
  "scope": "openid email profile",
  "sub": "e7b5a37b-d06a-4b40-92d7-36f09768ed79",
  "typ": "Bearer"
}
```



Kong-gratulations! have now reached the end of this module by authenticating your API requests with Keycloak. You can now click **Next** to proceed with the next module.




