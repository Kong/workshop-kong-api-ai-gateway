---
title : "Client Credentials"
weight : 1575
---

The main use case for the OAuth Client Credentials Grant is to address application authentication rather than user authentication. In such a scenario, authentication processes based on userid and password are not feasible. Instead, applications should deal with Client IDs and Client Secrets to authenticate and get a token.

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
consumers:
- username: kong_id
EOF
{{</highlight>}}

Note that we are going to map the Access Token to the Kong Consumer based on the ```client_id``` now.

Submit the declaration
{{<highlight>}}
deck gateway reset --konnect-control-plane-name kong-workshop --konnect-token $PAT -f
deck gateway sync --konnect-token $PAT oidc.yaml
{{</highlight>}}



#### Verification

```
curl -sX GET http://localhost/oidc-route/get -u "kong_id:RVXO9SOJskjw4LeVupjRbIMJIAyyil8j" | jq -r '.headers.Authorization' | cut -d " " -f 2 | jwt decode -
```

Expected Output
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
  "aud": "account",
  "azp": "kong_id",
  "clientAddress": "10.244.0.106",
  "clientHost": "10.244.0.106",
  "client_id": "kong_id",
  "email_verified": false,
  "exp": 1754944713,
  "iat": 1754944413,
  "iss": "http://keycloak.keycloak:8080/realms/kong",
  "jti": "trrtcc:643cf4cd-44ae-2a3f-d664-6580b274a108",
  "preferred_username": "service-account-kong_id",
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
  "sub": "e7b5a37b-d06a-4b40-92d7-36f09768ed79",
  "typ": "Bearer"
}
```


Kong-gratulations! have now reached the end of this module by authenticating your API requests with Keycloak. You can now click **Next** to proceed with the next module.




