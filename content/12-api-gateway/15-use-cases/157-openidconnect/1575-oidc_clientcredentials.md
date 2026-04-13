---
title : "Client Credentials"
weight : 1575
---

This page describes a configuration of the [Client Credentials Grant](https://oauth.net/2/grant-types/client-credentials/). Check the [OpenID Connect plugin documentation](https://developer.konghq.com/plugins/openid-connect/#client-credentials-grant-workflow) to learn more about it.

The main use case for the OAuth Client Credentials Grant is to address application authentication rather than user authentication. In such a scenario, authentication processes based on userid and password are not feasible. Instead, applications should deal with Client IDs and Client Secrets to authenticate and get a token.

#### Installing OpenID Connect Plugin

{{<highlight>}}
cat > oidc.yaml << 'EOF'
_format_version: "3.0"
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
consumers:
- username: client1
EOF
{{</highlight>}}

Note that we are going to map the Access Token to the Kong Consumer based on the ```client_id``` now.

Submit the declaration
{{<highlight>}}
deck gateway reset --konnect-control-plane-name kong-workshop --konnect-token $PAT -f
deck gateway sync --konnect-control-plane-name kong-workshop --konnect-token $PAT oidc.yaml
{{</highlight>}}



#### Verification

```
curl -sX GET http://localhost/oidc-route/get -u "client1:$CLIENT_SECRET" | jq -r '.headers.Authorization' | cut -d " " -f 2 | jwt decode -
```

Expected Output
```
Token header
------------
{
  "typ": "JWT",
  "alg": "RS256",
  "kid": "weLczjdEl67i4hvg_DTf6TcvYPPiCFIl_cXCYcoZKns"
}

Token claims
------------
{
  "acr": "1",
  "allowed-origins": [
    "http://localhost:80",
    "http://localhost"
  ],
  "aud": "account",
  "azp": "client1",
  "clientAddress": "10.244.0.48",
  "clientHost": "10.244.0.48",
  "client_id": "client1",
  "email_verified": false,
  "exp": 1776087001,
  "iat": 1776086701,
  "iss": "http://keycloak.keycloak:8080/realms/kong",
  "jti": "trrtcc:ad95a7dd-7f85-fb21-0fc6-535a1914aafb",
  "preferred_username": "service-account-client1",
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
  "scope": "openid profile email",
  "sub": "ecbbd65d-94d6-4a03-b1de-c4db2cf50ee4",
  "typ": "Bearer"
}
```


Kong-gratulations! have now reached the end of this module by authenticating your API requests with Keycloak. You can now click **Next** to proceed with the next module.




