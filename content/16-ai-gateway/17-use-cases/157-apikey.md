---
title : "Key Auth Plugin"
weight : 157
---

In this section, you will configure the **Key-Auth** plugin on the Kong Route to protect Amazon Bedrock.


#### Add Kong Key Authentication plugin and Kong Consumer

Add a KongPlugin resource for authentication, specifically the **Key-Auth** plugin. Note that, besides describing the plugin configuration, the declaration also creates a **Kong Consumer**, named ``user1``, with an API Key (``123456``) as its credential.

```
cat > ai-key-auth.yaml << 'EOF'
_format_version: "3.0"
_konnect:
  control_plane_name: kong-workshop
_info:
  select_tags:
  - llm
services:
- name: service1
  host: localhost
  port: 32000
  routes:
  - name: ollama-route
    paths:
    - /ollama-route
    plugins:
    - name: ai-proxy
      instance_name: ai-proxy-ollama
      config:
        route_type: llm/v1/chat
        model:
          provider: llama2
          name: llama3.2:1b
          options:
            llama2_format: ollama
            upstream_url: http://ollama.ollama:11434/api/chat
  - name: openai-route
    paths:
    - /openai-route
    plugins:
    - name: ai-proxy
      instance_name: ai-proxy-openai
      config:
        route_type: llm/v1/chat
        auth:
          header_name: Authorization
          header_value: Bearer ${{ env "DECK_OPENAI_API_KEY" }}
        model:
          provider: openai
          name: gpt-4.1
          options:
            temperature: 1.0
    - name: key-auth
      instance_name: key-auth-bedrock
      enabled: true
consumers:
- keyauth_credentials:
  - key: "123456"
  username: user1
EOF
```


Apply the declaration with decK:
```
deck gateway reset --konnect-control-plane-name kong-workshop --konnect-token $PAT -f
deck gateway sync --konnect-token $PAT ai-key-auth.yaml
```



#### Verify authentication is required
New requests now require authentication

```
curl -i -X POST \
  --url $DATA_PLANE_LB/openai-route \
  --header 'Content-Type: application/json' \
   --data '{
   "messages": [
     {
       "role": "user",
       "content": "Who is Jimi Hendrix?"
     }
   ]
  }'
```

* Expect response

The response is a ``HTTP/1.1 401 Unauthorized``, meaning the Kong Gateway Service requires authentication.

```
HTTP/1.1 401 Unauthorized
Date: Tue, 12 Aug 2025 14:53:42 GMT
Content-Type: application/json; charset=utf-8
Connection: keep-alive
WWW-Authenticate: Key
Content-Length: 96
X-Kong-Response-Latency: 1
Server: kong/3.11.0.2-enterprise-edition
X-Kong-Request-Id: fd1bc16647271a20b7245b0cc9eb5052

{
  "message":"No API key found in request",
  "request_id":"fd1bc16647271a20b7245b0cc9eb5052"
}
```

#### Send another request with an API key

Use the apikey to pass authentication to access the services.

```
curl -i -X POST \
  --url $DATA_PLANE_LB/openai-route \
  --header 'Content-Type: application/json' \
  --header 'apikey: 123456' \
  --data '{
   "messages": [
     {
       "role": "user",
       "content": "Who is Jimi Hendrix?"
     }
   ]
  }'
```

The request should now respond with a  **HTTP/1.1 200 OK**.

When submitting requests, the API Key name is defined, by default, ``apikey``. You can change the plugin configuration, if you will.



