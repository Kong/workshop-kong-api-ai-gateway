---
title : "Kong Identity"
weight : 10
---

[**Kong Identity**](https://developer.konghq.com/kong-identity/) enables you to use Konnect to generate, authenticate, and authorize API access. Specifically, Kong Identity can be used for machine-to-machine authentication. You can use Kong Identity to:

* Create authorization servers per region
* Issue and validate access tokens
* Integrate secure authentication into your Kong Gateway APIs


### Introspection Flow

This section describes the [**OAuth Token Introspection**](https://oauth.net/2/token-introspection/) implemented by **Kong MCP Gateway** and **Kong Identity** as the Identity Provider.


### Create the Authorization Server in Kong Identity

Before you can configure the **AI MCP OAuth2** plugin, you must first create an **Authorization Server** in **Kong Identity**. The AuthZ Server name is unique per each organization and each Konnect region. You can use the **Kong Identity** UI to create your AuthZ Server. However, we are going to exercise the [Kong Identity REST Admin APIs](https://developer.konghq.com/api/konnect/kong-identity) to do it. Make sure you still have the ``PAT`` environment variable set.

Create an auth server using the [``/v1/auth-servers``](https://developer.konghq.com/api/konnect/kong-identity/v1/#/operations/createAuthServer) endpoint. Note each AuthN Server has an audience specified.

:::code{showCopyAction=true showLineNumbers=false language=shell}
curl -sX POST "https://us.api.konghq.com/v1/auth-servers" \
  -H "Authorization: Bearer $PAT"\
  -H "Content-Type: application/json" \
  --json '{
    "name": "AuthZ_Server_1",
    "audience": "http://mcp_tools.dev",
    "description": "AuthZ Server 1"
  }' | jq
:::

You should get a response like this:

```
{
  "audience": "http://mcp_tools.dev",
  "created_at": "2026-02-17T17:42:23.194606Z",
  "description": "AuthZ Server 1",
  "id": "f5db888d-14d7-4f63-bcc8-ecf186e04f8f",
  "issuer": "https://lpjwyco0nr07jrva.us.identity.konghq.com/auth",
  "labels": {},
  "metadata_uri": "https://lpjwyco0nr07jrva.us.identity.konghq.com/auth/.well-known/openid-configuration",
  "name": "AuthZ_Server_1",
  "signing_algorithm": "RS256",
  "trusted_origins": [],
  "updated_at": "2026-02-17T17:42:23.194606Z"
}
```

##### Check your AuthZ Server

:::code{showCopyAction=true showLineNumbers=false language=shell}
curl -sX GET "https://us.api.konghq.com/v1/auth-servers" \
  -H "Authorization: Bearer $PAT" | jq
:::

Get the AuthZ Server Id:


:::code{showCopyAction=true showLineNumbers=false language=shell}
export AUTHZ_SERVER_ID=$(curl -sX GET "https://us.api.konghq.com/v1/auth-servers" -H "Authorization: Bearer $PAT" | jq -r '.data[0].id')
:::

Get the Issuer URL:

:::code{showCopyAction=true showLineNumbers=false language=shell}
export ISSUER_URL=$(curl -sX GET "https://us.api.konghq.com/v1/auth-servers" -H "Authorization: Bearer $PAT" | jq -r '.data[0].issuer')
:::



### Configure the AuthZ server with scopes

Configure a scope in your auth server using the [``/v1/auth-servers/$AUTHZ_SERVER_ID/scopes``](https://developer.konghq.com/api/konnect/kong-identity/v1/#/operations/createAuthServerScope) endpoint:

:::code{showCopyAction=true showLineNumbers=false language=shell}
curl -sX POST "https://us.api.konghq.com/v1/auth-servers/$AUTHZ_SERVER_ID/scopes" \
  -H "Authorization: Bearer $PAT"\
  -H "Content-Type: application/json" \
  --json '{
    "name": "scope1",
    "description": "scope1",
    "default": false,
    "include_in_metadata": false,
    "enabled": true
  }' | jq
:::

Expected response

```
{
  "created_at": "2026-02-17T17:44:20.009421Z",
  "default": false,
  "description": "scope1",
  "enabled": true,
  "id": "316b6d43-55db-4083-aec2-f975c15fcbd1",
  "include_in_metadata": false,
  "name": "scope1",
  "updated_at": "2026-02-17T17:44:20.009421Z"
}
```

Export your scope ID:

:::code{showCopyAction=true showLineNumbers=false language=shell}
export SCOPE_ID=$(curl -sX GET "https://us.api.konghq.com/v1/auth-servers/$AUTHZ_SERVER_ID/scopes" -H "Authorization: Bearer $PAT" | jq -r '.data[0].id')
:::



### Configure the AuthZ server with custom claims

Configure a custom claim using the [``/v1/auth-servers/$AUTHZ_SERVER_ID/claims``](https://developer.konghq.com/api/konnect/kong-identity/v1/#/operations/createAuthServerClaim) endpoint. A custom claim can be include in the tokens or inside a scope.


:::code{showCopyAction=true showLineNumbers=false language=shell}
curl -sX POST "https://us.api.konghq.com/v1/auth-servers/$AUTHZ_SERVER_ID/claims" \
  -H "Authorization: Bearer $PAT" \
  -H "Content-Type: application/json" \
  --json '{
    "name": "claim1",
    "value": "claim1",
    "include_in_token": true,
    "include_in_all_scopes": false,
    "include_in_scopes": [
      "'$SCOPE_ID'"
    ],
    "enabled": true
  }' | jq
:::

Expected output:

```
{
  "created_at": "2026-02-17T17:45:27.788763Z",
  "enabled": true,
  "id": "c74de2c0-7dcd-448f-8491-5eec965f4b6c",
  "include_in_all_scopes": false,
  "include_in_scopes": [
    "316b6d43-55db-4083-aec2-f975c15fcbd1"
  ],
  "include_in_token": true,
  "name": "claim1",
  "updated_at": "2026-02-17T17:45:27.788763Z",
  "value": "claim1"
}
```

### Create a client in the AuthZ Server

The client is the machine-to-machine credential. In this tutorial, Konnect will autogenerate the **Client ID** and **Client Secret**, but you can alternatively specify one yourself.

Configure the client using the [``/v1/auth-servers/$AUTHZ_SERVER_ID/clients``](https://developer.konghq.com/api/konnect/kong-identity/v1/#/operations/createAuthServerClient) endpoint. Note the the Access Token duration has a timeout of 60 seconds:

:::code{showCopyAction=true showLineNumbers=false language=shell}
curl -sX POST "https://us.api.konghq.com/v1/auth-servers/$AUTHZ_SERVER_ID/clients" \
  -H "Authorization: Bearer $PAT"\
  -H "Content-Type: application/json" \
  --json '{
    "name": "client1",
    "grant_types": [
      "client_credentials"
    ],
    "allow_all_scopes": false,
    "allow_scopes": [
      "'$SCOPE_ID'"
    ],
    "access_token_duration": 60,
    "id_token_duration": 60,
    "response_types": [
      "id_token",
      "token"
    ]
  }' | jq
:::

Expected output:

```
{
  "access_token_duration": 60,
  "allow_all_scopes": false,
  "allow_scopes": [
    "316b6d43-55db-4083-aec2-f975c15fcbd1"
  ],
  "client_secret": "7o85r56b48aiba4hrxc60i6n",
  "created_at": "2026-02-17T17:47:21.073803Z",
  "grant_types": [
    "client_credentials"
  ],
  "id": "p4aih3vylfgl3d8a",
  "id_token_duration": 60,
  "labels": {},
  "login_uri": null,
  "name": "client1",
  "redirect_uris": [],
  "response_types": [
    "id_token",
    "token"
  ],
  "token_endpoint_auth_method": "client_secret_post",
  "updated_at": "2026-02-17T17:47:21.073803Z"
}
```

The Client Secret will not be shown again, so copy both ID and Secret:

```
export CLIENT_ID=<YOUR_CLIENT_ID>
export CLIENT_SECRET=<YOUR_CLIENT_SECRET>

For example:
export CLIENT_ID=p4aih3vylfgl3d8a
export CLIENT_SECRET=7o85r56b48aiba4hrxc60i6n
```


## Checking you Kong Identity Authorization Server

Kong Identity provides the standard endpoint ```$ISSUER_URL/.well-known/openid-configuration``` where you can get these and several other Kong Identity configuration parameters.


:::code{showCopyAction=true showLineNumbers=false language=shell}
curl -s $ISSUER_URL/.well-known/openid-configuration | jq
:::

Typical response:

```
{
  "issuer": "https://lpjwyco0nr07jrva.us.identity.konghq.com/auth",
  "authorization_endpoint": "https://lpjwyco0nr07jrva.us.identity.konghq.com/auth/authorize",
  "token_endpoint": "https://lpjwyco0nr07jrva.us.identity.konghq.com/auth/oauth/token",
  "introspection_endpoint": "https://lpjwyco0nr07jrva.us.identity.konghq.com/auth/introspect",
  "userinfo_endpoint": "https://lpjwyco0nr07jrva.us.identity.konghq.com/auth/userinfo",
  "revocation_endpoint": "https://lpjwyco0nr07jrva.us.identity.konghq.com/auth/revoke",
  "end_session_endpoint": "https://lpjwyco0nr07jrva.us.identity.konghq.com/auth/end_session",
  "device_authorization_endpoint": "https://lpjwyco0nr07jrva.us.identity.konghq.com/auth/device_authorization",
  "jwks_uri": "https://lpjwyco0nr07jrva.us.identity.konghq.com/auth/.well-known/jwks",
  "scopes_supported": [
    "openid",
    "offline_access"
  ],
  "response_types_supported": [
    "code",
    "id_token",
    "id_token token"
  ],
  "grant_types_supported": [
    "authorization_code",
    "implicit",
    "refresh_token",
    "client_credentials",
    "urn:ietf:params:oauth:grant-type:jwt-bearer"
  ],
  "subject_types_supported": [
    "public"
  ],
  "id_token_signing_alg_values_supported": [
    "RS256"
  ],
  "token_endpoint_auth_methods_supported": [
    "none",
    "client_secret_basic",
    "client_secret_post"
  ],
  "revocation_endpoint_auth_methods_supported": [
    "none",
    "client_secret_basic",
    "client_secret_post"
  ],
  "revocation_endpoint_auth_signing_alg_values_supported": [
    "RS256"
  ],
  "introspection_endpoint_auth_methods_supported": [
    "client_secret_basic"
  ],
  "introspection_endpoint_auth_signing_alg_values_supported": [
    "RS256"
  ],
  "code_challenge_methods_supported": [
    "S256"
  ],
  "ui_locales_supported": [
    "en"
  ],
  "request_uri_parameter_supported": false
}
```


#### Kong Identity User Interface

You can also check the Konnect UI with your Authorization Server and its Clients, Scopes and Claims defined:


![Kong Identity configuration page](/static/images/kong_identity.png)















