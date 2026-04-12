---
title : "AI MCP OAuth2 plugin configuration"
weight : 20
---

### Download the new decK file

* Download the [**marketplace_mcp_oauth_kong_identity.yaml**](/code/marketplace_mcp_oauth_kong_identity.yaml) spec.


The declaration extends the ```mcp-listener-route```, responsible for aggregating the MCP Tools, with the **AI MCP OAuth2** plugin.

```
routes:
  - name: mcp-listener-route
    paths:
    - /mcp-listener
    plugins:
      - name: ai-mcp-proxy
        config:
          mode: listener
          server:
            tag: mcp-tools
            timeout: 45000
          max_request_body_size: 32768
      - name: ai-mcp-oauth2
        enabled: true
        config:
          resource: ${{ env "DECK_MCP_AUTH_URL" }}
          authorization_servers:
          - ${{ env "DECK_KONG_IDENTITY_AUTHZ_URL" }}
          introspection_endpoint: ${{ env "DECK_KONG_IDENTITY_INTROSPECTION_URL" }}
          client_id: ${{ env "DECK_CLIENT_ID" }}
          client_secret: ${{ env "DECK_CLIENT_SECRET" }}
          insecure_relaxed_audience_validation: true
```


It refers to some **Kong Identity** endpoints and secrets, besides the actual Authorization URL. Let's go through them:

* **resource**: that's the **MCP Tool URL**, exposed by the Kong Data Plane. Considering our declaration should be like this: ```http://$DATA_PLANE_LB/mcp-listener```.

* **authorization_servers**: that's the Kong Identity Authorization endpoint. Although it's required, for Client Credentials Grant, it's ignored. It should be something like: ```https://4bim7lj9i47ef25x.us.identity.konghq.com/auth/authorize```

* **introspection_endpoint**: that's the Kong Identity Introspection endpoint. In our case, ```https://4bim7lj9i47ef25x.us.identity.konghq.com/auth/introspect```

* **client_id** and **client_secret**: these are the secrets of an existing Kong Identity Client.



### Submit the decK declaration to your Control Plane

Before submiting the new declaration we have set the decK environment variables:

```
export DECK_MCP_AUTH_URL=http://$DATA_PLANE_LB/mcp-listener
export DECK_KONG_IDENTITY_AUTHZ_URL=$ISSUER_URL/authorize
export DECK_KONG_IDENTITY_INTROSPECTION_URL=$ISSUER_URL/introspect
export DECK_CLIENT_ID=$CLIENT_ID
export DECK_CLIENT_SECRET=$CLIENT_SECRET
```


```
deck gateway reset --konnect-control-plane-name kong-aws --konnect-token $PAT -f
deck gateway sync --konnect-control-plane-name kong-aws --konnect-token $PAT marketplace_mcp_oauth_kong_identity.yaml
```



### Exploring the Token and Introspection Endpoints

To exercise the Introspection Endpoint, let's send some requests to Kong Identity, acting as the Consumer and the Gateway.

#### Token Endpoint

In the first request, we play the Consumer role, using the [**Client Credentials Grant**](https://oauth.net/2/grant-types/client-credentials/) to get our Access Token

```
TOKEN=$(curl -s -X POST "$ISSUER_URL/oauth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=$CLIENT_ID" \
  -d "client_secret=$CLIENT_SECRET" \
  -d "scope=scope1" | jq -r '.access_token')
```



You can decode the Access Token with:

```
echo $TOKEN | jwt decode -
```

You should get an output like this. The ``sub`` field represents the same ``client_id``.

```
Token header
------------
{
  "typ": "JWT",
  "alg": "RS256",
  "kid": "0c6b4da3-e954-43fb-b435-29df04f40bdf"
}

Token claims
------------
{
  "aud": [
    "http://mcp_tools.dev"
  ],
  "claim1": "claim1",
  "client_id": "p4aih3vylfgl3d8a",
  "exp": 1771350984,
  "iat": 1771350924,
  "iss": "https://lpjwyco0nr07jrva.us.identity.konghq.com/auth",
  "jti": "019c6cbe-1de8-7bb4-b1a4-85c5864a1eb0",
  "nbf": 1771350924,
  "scope": "scope1",
  "sub": "p4aih3vylfgl3d8a"
}
```



You can check all tokens issued by a given Client ID:
```
curl -sX GET "https://us.api.konghq.com/v1/auth-servers/$AUTHZ_SERVER_ID/clients/$CLIENT_ID/tokens" -H "Authorization: Bearer $PAT" | jq
```


If you send a request asking for a now existing **scope**, Kong Identity will reply back with an error:

```
curl -s -X POST "$ISSUER_URL/oauth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=$CLIENT_ID" \
  -d "client_secret=$CLIENT_SECRET" \
  -d "scope=non-existing-scope"
```

Expected result:

```
{"error":"invalid_scope"}
```

#### Introspection Endpoint

Now, playing the Gateway role, we are going to consume the Introspection Endpoint asking the IdP to validate the Access Token. We use the [``-u`` **curl** option](https://curl.se/docs/manpage.html#-u) to specify our Client Id and Client Secret.

```
curl -s -X POST "$ISSUER_URL/introspect" \
  -d "token=$TOKEN" \
  -u "$CLIENT_ID:$CLIENT_SECRET" | jq
```


Here's a typical response. The “active” at the bottom says the plugin is still good.

```
{
  "active": true,
  "claim1": "claim1",
  "client_id": "p4aih3vylfgl3d8a",
  "scope": "scope1"
}
```



However, if you wait for the Access Token timeout (in our case, the defined it as 30 seconds), the Endpoint returns a different output saying so:

```
{
  "active": false
}
```



Make sure you unset your ``TOKEN`` environment variable:
```
unset TOKEN
```




You can now click **Next** to proceed further.
