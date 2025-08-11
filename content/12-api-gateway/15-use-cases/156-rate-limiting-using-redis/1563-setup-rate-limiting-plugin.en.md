---
title : "Set up Rate Limiting plugin"
weight : 1563
---


#### Add Rate Limiting plugin

Just like you did before, add the **Rate Limiting** plugin on the Route setting **Minute** as 5 requests per minute, and set the identifier to **Service**.


{{<highlight>}}
cat > rate-limiting.yaml << 'EOF'
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
  - name: rate-limiting-route
    paths:
    - /rate-limiting-route
    plugins:
    - name: rate-limiting
      instance_name: rate-limiting1
      config:
        minute: 5
EOF
{{</highlight>}}



Submit the declaration:

{{<highlight>}}
deck gateway sync --konnect-token $PAT rate-limiting.yaml
{{</highlight>}}



#### Verify traffic control

Again, test the rate-limiting policy by executing the following command multiple times and observe the rate-limit headers in the response, specially, `X-RateLimit-Remaining-Minute`, `RateLimit-Reset` and `Retry-After` :

{{<highlight>}}
curl -I $DATA_PLANE_LB/rate-limiting-route/get
{{</highlight>}}

**Response**

```
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 389
Connection: keep-alive
X-RateLimit-Limit-Minute: 5
X-RateLimit-Remaining-Minute: 4
RateLimit-Reset: 44
RateLimit-Remaining: 4
RateLimit-Limit: 5
Server: gunicorn
Date: Mon, 11 Aug 2025 14:55:16 GMT
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true
X-Kong-Upstream-Latency: 10
X-Kong-Proxy-Latency: 5
Via: 1.1 kong/3.11.0.2-enterprise-edition
X-Kong-Request-Id: 7f13e52db83e4e673798120134496d03
```

As explected, after sending too many requests,once the rate limiting is reached, you will see `HTTP/1.1 429 Too Many Requests`

```
# curl -I $DATA_PLANE_LB/rate-limiting-route/get
HTTP/1.1 429 Too Many Requests
Date: Mon, 11 Aug 2025 14:55:20 GMT
Content-Type: application/json; charset=utf-8
Connection: keep-alive
X-RateLimit-Limit-Minute: 5
X-RateLimit-Remaining-Minute: 0
RateLimit-Reset: 40
Retry-After: 40
RateLimit-Remaining: 0
RateLimit-Limit: 5
Content-Length: 92
X-Kong-Response-Latency: 2
Server: kong/3.11.0.2-enterprise-edition
X-Kong-Request-Id: c01dcb02ea13676ca5e49e7e1c40982b
```

### Results
As there is a single Kong Data Plane Runtime instance running, Kong correctly imposes the rate-limit and you can make only 5 requests in a minute.
