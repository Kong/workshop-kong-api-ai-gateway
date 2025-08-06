---
title : "Key Auth Plugin"
weight : 157
---

In this section, you will configure the **Key-Auth** plugin on the Kong Route to protect Amazon Bedrock.


#### Add Kong Key Authentication plugin and Kong Consumer

Add a KongPlugin resource for authentication, specifically the **Key-Auth** plugin. Note that, besides describing the plugin configuration, the declaration also creates a **Kong Consumer**, named ``user1``, with an API Key (``123456``) as its credential.

:::code{showCopyAction=true showLineNumbers=false language=shell}
cat > ai-key-auth.yaml << 'EOF'
_format_version: "3.0"
_konnect:
  control_plane_name: kong-aws
_info:
  select_tags:
  - bedrock
services:
- name: service1
  host: localhost
  port: 32000
  routes:
  - name: route1
    paths:
    - /bedrock-route
    plugins:
    - name: ai-proxy
      instance_name: ai-proxy-bedrock-route
      enabled: true
      config:
        auth:
          param_name: "allow_override"
          param_value: "false"
          param_location: "body"
        route_type: llm/v1/chat
        model:
          provider: bedrock
          options:
            bedrock:
              aws_region: us-west-2
    - name: key-auth
      instance_name: key-auth-bedrock
      enabled: true
consumers:
- keyauth_credentials:
  - key: "123456"
  username: user1
EOF
:::


Apply the declaration with decK:
:::code{showCopyAction=true showLineNumbers=false language=shell}
deck gateway reset --konnect-control-plane-name kong-aws --konnect-token $PAT -f
deck gateway sync --konnect-token $PAT ai-key-auth.yaml
:::



#### Verify authentication is required
New requests now require authentication

:::code{showCopyAction=true showLineNumbers=false language=shell}
curl -i -X POST \
  --url $DATA_PLANE_LB/bedrock-route \
  --header 'Content-Type: application/json' \
   --data '{
   "messages": [
     {
       "role": "user",
       "content": "Who is Jimi Hendrix?"
     }
   ],
   "model": "us.amazon.nova-lite-v1:0"
  }'
:::

* Expect response

The response is a ``HTTP/1.1 401 Unauthorized``, meaning the Kong Gateway Service requires authentication.

```
HTTP/1.1 401 Unauthorized
Date: Wed, 14 May 2025 18:38:01 GMT
Content-Type: application/json; charset=utf-8
Connection: keep-alive
WWW-Authenticate: Key
Content-Length: 96
X-Kong-Response-Latency: 1
Server: kong/3.10.0.1-enterprise-edition
X-Kong-Request-Id: 8feb9f43ffb49565779f5a329cd33140

{
  "message":"No API key found in request",
  "request_id":"8feb9f43ffb49565779f5a329cd33140"
}
```

#### Send another request with an API key

Use the apikey to pass authentication to access the services.

:::code{showCopyAction=true showLineNumbers=false language=shell}
curl -i -X POST \
  --url $DATA_PLANE_LB/bedrock-route \
  --header 'Content-Type: application/json' \
  --header 'apikey: 123456' \
  --data '{
   "messages": [
     {
       "role": "user",
       "content": "Who is Jimi Hendrix?"
     }
   ],
   "model": "us.amazon.nova-lite-v1:0"
  }'
:::

The request should now respond with a  **HTTP/1.1 200 OK**.

When submitting requests, the API Key name is defined, by default, ``apikey``. You can change the plugin configuration, if you will.



