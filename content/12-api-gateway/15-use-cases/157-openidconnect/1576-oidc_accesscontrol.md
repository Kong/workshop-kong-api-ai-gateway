---
title : "Authorization"
weight : 1576
---

So far, we have used the OpenID Connect plugin to implement Authentication processes only.


* The **aud** (Audience) claim comes from the JWT specification in [RFC 7519]. It allows the receiving party to verify whether a given JWT was intended for them. Per the specification, the aud value can be a single string or an array of strings.

**aud** - Identifies the audience (resource URI or server) that this access token is intended for.


* The **scope** claim originates from the OAuth 2.0 specification in [RFC 6749]. It defines the range of access granted by an access token, limiting it to specific claims or user data. For example, you might not want a third-party client to query any arbitrary resource using an OAuth 2.0 access token. Instead, the scope claim restricts the token’s permissions to a predefined set of resources or operations.

**scp** - Array of scopes that are granted to this access token.

The OpenID Connect plugin supports some [coarse-grained authorization](https://developer.konghq.com/plugins/openid-connect/#authorization) mechanisms:
* Claims-based authorization
* ACL plugin authorization
* Consumer authorization

This section is going to show how to use the plugin to implement an Authorization mechanism based on the [OAuth Scopes](https://oauth.net/2/scope/).

**OAuth Scopes** allow us to limit access to an Access Token. The configuration gets started, including a new setting to our OpenId Connect plugin: "audience_required". The following configuration defines that the Kong Route can be consumed by requests that have Access Tokens with the "aud" field set as "gold". This is a nice option to implement, for instance, Kong Konnect consumer classes.




#### Installing OpenID Connect Plugin

```
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
- username: client1
EOF
```

Submit the declaration
```
deck gateway reset --konnect-control-plane-name kong-workshop --konnect-token $PAT -f
deck gateway sync --konnect-control-plane-name kong-workshop --konnect-token $PAT oidc.yaml
```



If we try to consume the Kong Route we are going to get an new error:

```
curl -iX GET http://localhost/oidc-route/get -u "client1:$CLIENT_SECRET"
```

```
HTTP/1.1 403 Forbidden
Date: Mon, 13 Apr 2026 13:33:51 GMT
Content-Type: application/json; charset=utf-8
Connection: keep-alive
WWW-Authenticate: Bearer realm="keycloak.keycloak", error="insufficient_scope"
Content-Length: 23
X-Kong-Response-Latency: 14
Server: kong/3.14.0.1-enterprise-edition
X-Kong-Request-Id: 994c85374cf460665518623ef7914a00

{"message":"Forbidden"}
```

Note that the response describes the reason why we cannot consume the Route.

#### Issue a new Admin Token

The custom scope creation process requires a Keycloak Token. You might get error as the Token gets expired. Execute the following command to issue a new Token and proceed with the process.

```
TOKEN=$(curl -s http://$KEYCLOAK_LB:8080/realms/master/protocol/openid-connect/token \
  -d "client_id=admin-cli" \
  -d "username=admin" \
  -d "password=admin" \
  -d "grant_type=password" \
  | jq -r .access_token)
```


#### Create the new Keycloak Custom Client Scope

###### 1. Client Scope
The first thing to do is to create a Client Scope in Keycloak. Go to the **kong** realm and click the **Client scopes** option in the left menu. Name the Client Scope as ``kong_scope`` and click "Save".

CLI version
```
curl -X POST http://$KEYCLOAK_LB:8080/admin/realms/kong/client-scopes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "kong_scope",
    "protocol": "openid-connect"
  }'
```


###### 2. Client Scope Mapper
Click the **Mappers** tab now and choose **Configure a new mapper**. Choose **Audience** and name it as ``kong_mapper``. For the **Included Custom Audience** field type ``gold``, which is the audience the plugin has been configured. Click Save.

CLI version
```
SCOPE_ID=$(curl -s http://$KEYCLOAK_LB:8080/admin/realms/kong/client-scopes \
  -H "Authorization: Bearer $TOKEN" | jq -r '.[] | select(.name=="kong_scope") | .id')
```

```
curl -X POST http://$KEYCLOAK_LB:8080/admin/realms/kong/client-scopes/$SCOPE_ID/protocol-mappers/models \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "kong_mapper",
    "protocol": "openid-connect",
    "protocolMapper": "oidc-audience-mapper",
    "consentRequired": false,
    "config": {
      "included.custom.audience": "gold",
      "id.token.claim": "true",
      "access.token.claim": "true"
    }
  }'
```

###### 3. Apply the Custom Scope to the Client
Now click on the **Clients** option in the left menu and choose our ``client1`` client. Client the **Client scopes** tab and add the new ``kong_scope`` we just created it as ``Default``:

CLI version

```
CLIENT_UUID=$(curl -s http://$KEYCLOAK_LB:8080/admin/realms/kong/clients \
  -H "Authorization: Bearer $TOKEN" | jq -r '.[] | select(.clientId=="client1") | .id')
```

```
curl -X PUT http://$KEYCLOAK_LB:8080/admin/realms/kong/clients/$CLIENT_UUID/default-client-scopes/$SCOPE_ID \
  -H "Authorization: Bearer $TOKEN"
```


###### 4. Disable **Full scope allowed**
As you can see in our previous requests, Keycloak adds, by default, the ``account`` audience as ``aud``: ``account`` field inside the Access Token. One last optional step is to remove it, so the token should have our "gold" audience only. To do that, click the default ``<client_id>-dedicated`` Client Scope (in our case, ``client1-dedicated``) and its Scope tab. Inside the **Scope** tab, turn the "Full scope allowed" option off.

CLI version

```
curl -X PUT http://$KEYCLOAK_LB:8080/admin/realms/kong/clients/$CLIENT_UUID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "client1",
    "fullScopeAllowed": false
  }'
```




#### Test the Keycloak Endpoint
Send a request to Keycloak again to test the new configuration:

```
curl -s -X POST 'http://localhost:8080/realms/kong/protocol/openid-connect/token' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'client_id=client1' \
--data-urlencode "client_secret=$CLIENT_SECRET" \
--data-urlencode 'grant_type=client_credentials' | jq -r '.access_token' | jwt decode - | grep aud
```

Expected output
```
  "aud": "gold",
```


#### Consume the Kong Route again
You should be able to consumer the Kong Route now.

```
curl -sX GET http://localhost:80/oidc-route/get -u "client1:$CLIENT_SECRET" | jq -r '.headers.Authorization' | cut -d " " -f 2 | jwt decode -
```

Expected output
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
  "aud": "gold",
  "azp": "client1",
  "clientAddress": "10.244.0.48",
  "clientHost": "10.244.0.48",
  "client_id": "client1",
  "email_verified": false,
  "exp": 1776089031,
  "iat": 1776088731,
  "iss": "http://keycloak.keycloak:8080/realms/kong",
  "jti": "trrtcc:cb49d176-f5af-69bf-9f46-a2001a837556",
  "preferred_username": "service-account-client1",
  "scope": "openid profile email",
  "sub": "9ec92c29-d881-4365-8f3f-92cf7b2996ff",
  "typ": "Bearer"
}
```



Kong-gratulations! have now reached the end of this module by authenticating your API requests with Keycloak. You can now click **Next** to proceed with the next module.




