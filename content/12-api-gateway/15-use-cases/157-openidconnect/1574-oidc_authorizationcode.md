---
title : "Authorization Code"
weight : 1574
---

This page describes a configuration of the [Authorization Code Grant](https://oauth.net/2/grant-types/authorization-code/). Check the [OpenID Connect plugin documentation](https://developer.konghq.com/plugins/openid-connect/#authorization-code-flow) to learn more about it.

#### Installing OpenID Connect Plugin

All Keycloak settings are available for the OIDC plugin in the following address:

````
curl http://localhost:8080/realms/kong/.well-known/openid-configuration | jq
````

The most important ones are the endpoints necessary to implement the Grant:

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
        auth_methods: ["authorization_code"]
        redirect_uri:
        - http://localhost/oidc-route/get
        client_id: ["kong_id"]
        client_secret: ["RVXO9SOJskjw4LeVupjRbIMJIAyyil8j"]
        issuer: http://127.0.0.1:8080/realms/kong
        authorization_endpoint: http://127.0.0.1:8080/realms/kong/protocol/openid-connect/auth
        token_endpoint: http://keycloak.keycloak:8080/realms/kong/protocol/openid-connect/token
        extra_jwks_uris: ["http://keycloak.keycloak.svc.cluster.local:8080/realms/kong/protocol/openid-connect/certs"]
        consumer_optional: false
        consumer_claim: ["preferred_username"]
        consumer_by: ["username"]
consumers:
- username: consumer1
EOF
{{</highlight>}}

An important observation here is that we have the OpenId Connect plugin configured with the Kong Consumer mapping. The ```consumer_claim``` setting specifies that the plugin will take the ```preferred_username``` field from the Access Token to map it to some Kong Consumer. The Kong Consumer chosen is the one that has the same ```preferred_username``` as its ```username```. The declaration above configures the OIDC plugin as well as creates the necessary consumer. Later on you can apply plugin to the Kong Consumer to define specific policies.


Submit the declaration
{{<highlight>}}
deck gateway sync --konnect-token $PAT oidc.yaml
{{</highlight>}}



#### Verification

Redirect your browser the following URL. Since you haven't been authenticated, you will be redirected to Keycloak's Authentication page:

{{<highlight>}}
http://localhost/oidc-route/get
{{</highlight>}}

![keycloak_auth](/static/images/keycloak_auth.png)

As credentials, enter the Keycloak user and password previously created: ```consumer1/kong```. After filling out the form with your email and name you, Keycloak authenticates you and redirects you back to the original URL (Data Plane), this time adding the Authorization Code. Following the steps described previously, the OpenId Connect plugin sends another request to Keycloak, using the ```client_id``` and ```client_secret``` pair, configured in the plugin, to validate the Authorization Code and ask Keycloak to issue the Access Token. The Data Plane finally routes the request to the HTTPbin application. As expected, the response, this time, includes the access token issued by Keycloak which was injected by the plugin as a Bearer Token

![keycloak_httpbin](/static/images/keycloak_httpbin.png)


If you copy the token and decodes it with jwt you should see an output similar to this:

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
  "acr": "0",
  "allowed-origins": [
    "/*"
  ],
  "aud": "account",
  "auth_time": 1754941018,
  "azp": "kong_id",
  "email": "claudio.acquaviva@gmail.com",
  "email_verified": false,
  "exp": 1754941664,
  "family_name": "Acquaviva",
  "given_name": "Claudio",
  "iat": 1754941364,
  "iss": "http://127.0.0.1:8080/realms/kong",
  "jti": "onrtac:db97da58-1793-834c-dae8-b46fd2d65cfd",
  "name": "Claudio Acquaviva",
  "preferred_username": "consumer1",
  "realm_access": {
    "roles": [
      "offline_access",
      "uma_authorization",
      "default-roles-kong"
    ]
  },
  "resource_access": {
    "account": {
      "roles": [
        "manage-account",
        "manage-account-links",
        "view-profile"
      ]
    }
  },
  "scope": "openid email profile",
  "sid": "8bdb5227-c84b-4f06-ad00-9632dbdd9397",
  "sub": "88dffdc3-c80f-4349-9a73-4c8da93bb290",
  "typ": "Bearer"
}
```

Kong-gratulations! have now reached the end of this module by authenticating your API requests with Keycloak. You can now click **Next** to proceed with the next module.




