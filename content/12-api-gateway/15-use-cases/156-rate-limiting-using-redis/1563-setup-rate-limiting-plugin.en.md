---
title : "Set up Rate Limiting plugin"
weight : 1563
---


#### Add Rate Limiting plugin

Just like you did before, add the **Rate Limiting** plugin on the Route setting **Minute** as 5 requests per minute, and set the identifier to **Service**.


:::code{showCopyAction=true showLineNumbers=false language=shell}
cat > rate-limiting.yaml << 'EOF'
_format_version: "3.0"
_konnect:
  control_plane_name: kong-aws
_info:
  select_tags:
  - httpbin-service-route
services:
- name: httpbin-service
  host: httpbin.kong.svc.cluster.local
  port: 8000
  routes:
  - name: rate-limiting-route
    paths:
    - /rate-limiting-route
    plugins:
    - name: rate-limiting
      instance_name: rate-limiting1
      config:
        minute: 5
EOF
:::



Submit the declaration:

:::code{showCopyAction=true showLineNumbers=false language=shell}
deck gateway sync --konnect-token $PAT rate-limiting.yaml
:::



#### Verify traffic control

Again, test the rate-limiting policy by executing the following command multiple times and observe the rate-limit headers in the response, specially, `X-RateLimit-Remaining-Minute`, `RateLimit-Reset` and `Retry-After` :

:::code{showCopyAction=true showLineNumbers=false language=shell}
curl -I $DATA_PLANE_LB/rate-limiting-route/get
:::

**Response**

```
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 455
Connection: keep-alive
RateLimit-Limit: 5
RateLimit-Reset: 10
RateLimit-Remaining: 4
X-RateLimit-Limit-Minute: 5
X-RateLimit-Remaining-Minute: 4
Server: gunicorn
Date: Wed, 28 May 2025 12:30:50 GMT
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true
X-Kong-Upstream-Latency: 1
X-Kong-Proxy-Latency: 1
Via: 1.1 kong/3.10.0.1-enterprise-edition
X-Kong-Request-Id: 6209954ef700ea7b7b23b8003b318e74
```

As explected, after sending too many requests,once the rate limiting is reached, you will see `HTTP/1.1 429 Too Many Requests`

```
# curl -I $DATA_PLANE_LB/rate-limiting-route/get
HTTP/1.1 429 Too Many Requests
Date: Wed, 28 May 2025 12:30:55 GMT
Content-Type: application/json; charset=utf-8
Connection: keep-alive
RateLimit-Limit: 5
Retry-After: 5
RateLimit-Reset: 5
RateLimit-Remaining: 0
X-RateLimit-Limit-Minute: 5
X-RateLimit-Remaining-Minute: 0
Content-Length: 92
X-Kong-Response-Latency: 0
Server: kong/3.10.0.1-enterprise-edition
X-Kong-Request-Id: 597fcd055d14c0189a6224041553e267
```

### Results
As there is a single Kong Data Plane Runtime instance running, Kong correctly imposes the rate-limit and you can make only 5 requests in a minute.
