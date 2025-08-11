---
title : "Proxy Caching"
weight : 150
---

[Proxy Caching](https://docs.konghq.com/hub/kong-inc/proxy-cache/) provides a reverse proxy cache implementation for Kong. It caches response entities based on configurable response code and content type, as well as request method. It can cache per-Consumer or per-API. Cache entities are stored for a configurable period of time, after which subsequent requests to the same resource will re-fetch and re-store the resource. Cache entities can also be forcefully purged via the Admin API prior to their expiration time.

### Kong Gateway Plugin list

Before enabling the **Proxy Caching**, let's check the list of plugins Konnect provides. Inside the ``kong-workshop`` Control Plane, click on **Plugins** menu option and **+ New plugin**. You should the following page with all plugins available:

![proxy_cache](/static/images/plugins.png)

### Enabling a Kong Plugin on a Kong Service
Create another declaration with ``plugins`` option. With this option you can enable and configure the plugin on your Kong Service.

{{<highlight>}}
cat > httpbin.yaml << 'EOF'
_format_version: "3.0"
_konnect:
  control_plane_name: kong-workshop
_info:
  select_tags:
  - httpbin-service-route
services:
- name: httpbin-service
  tags:
  - httpbin-service-route
  host: httpbin.kong.svc.cluster.local
  port: 8000
  plugins:
  - name: proxy-cache
    instance_name: proxy-cache1
    config:
      strategy: memory
      cache_ttl: 30
  routes:
  - name: httpbin-route
    tags:
    - httpbin-service-route
    paths:
    - /httpbin-route
EOF
{{</highlight>}}


For the plugin configuration we used the following settings:
* **strategy** with ``memory``. The plugin will use the Runtime Instance's memory to implement to cache.
* **cache_ttl** with ``30``, which means the plugin will clear all data that reached this time limit.

All plugin configuration paramenters are described inside **[Kong Plugin Hub](https://docs.konghq.com/hub/)** portal, in its specific [documentation page](https://docs.konghq.com/hub/kong-inc/proxy-cache/).

#### Submit the new declaration
{{<highlight>}}
deck gateway sync --konnect-token $PAT httpbin.yaml
{{</highlight>}}

**Expected Output**
```
creating plugin proxy-cache for service httpbin-service
Summary:
  Created: 1
  Updated: 0
  Deleted: 0
```


#### Consume the Service

If you consume the service again, you'll see some new headers describing the caching status:

{{<highlight>}}
curl -v $DATA_PLANE_LB/httpbin-route/get
{{</highlight>}}

```
*   Trying 127.0.0.1:80...
* Connected to 127.0.0.1 (127.0.0.1) port 80
> GET /httpbin-route/get HTTP/1.1
> Host: 127.0.0.1
> User-Agent: curl/8.7.1
> Accept: */*
> 
* Request completely sent off
< HTTP/1.1 200 OK
< Content-Type: application/json
< Content-Length: 377
< Connection: keep-alive
< X-Cache-Key: a00008105a989fd0fa8a1eeeee08924b7205d24ed1adee71698926c12a31f2b7
< X-Cache-Status: Miss
< Server: gunicorn
< Date: Mon, 11 Aug 2025 14:39:46 GMT
< Access-Control-Allow-Origin: *
< Access-Control-Allow-Credentials: true
< X-Kong-Upstream-Latency: 8
< X-Kong-Proxy-Latency: 6
< Via: 1.1 kong/3.11.0.2-enterprise-edition
< X-Kong-Request-Id: 4501cc0fa798cf08435edc01bb2b1a40
< 
{"args":{},"headers":{"Accept":"*/*","Connection":"keep-alive","Host":"httpbin.kong.svc.cluster.local:8000","User-Agent":"curl/8.7.1","X-Forwarded-Host":"127.0.0.1","X-Forwarded-Path":"/httpbin-route/get","X-Forwarded-Prefix":"/httpbin-route","X-Kong-Request-Id":"4501cc0fa798cf08435edc01bb2b1a40"},"origin":"10.244.0.1","url":"http://httpbin.kong.svc.cluster.local:8000/get"}
* Connection #0 to host 127.0.0.1 left intact
```

Notice that, for the first request we get **Miss** for the **X-Cache-Status** header, meaning that the Runtime Instance didn't have any data avaialble in the cache and had to connect to the Upstream Service, ``httpbin.org``.

If we send a new request, the Runtime Instance has all it needs to satify the request, therefore the status is **Hit**. Note that the latency time has dropped considerably.

```
# curl -v $DATA_PLANE_LB/httpbin-route/get
*   Trying 127.0.0.1:80...
* Connected to 127.0.0.1 (127.0.0.1) port 80
> GET /httpbin-route/get HTTP/1.1
> Host: 127.0.0.1
> User-Agent: curl/8.7.1
> Accept: */*
> 
* Request completely sent off
< HTTP/1.1 200 OK
< Content-Type: application/json
< Connection: keep-alive
< X-Cache-Key: a00008105a989fd0fa8a1eeeee08924b7205d24ed1adee71698926c12a31f2b7
< Access-Control-Allow-Credentials: true
< X-Cache-Status: Hit
< Access-Control-Allow-Origin: *
< Date: Mon, 11 Aug 2025 14:40:17 GMT
< age: 3
< Server: gunicorn
< Content-Length: 377
< X-Kong-Upstream-Latency: 0
< X-Kong-Proxy-Latency: 1
< Via: 1.1 kong/3.11.0.2-enterprise-edition
< X-Kong-Request-Id: 97cc6027e33f240a67d8930161b44e57
< 
{"args":{},"headers":{"Accept":"*/*","Connection":"keep-alive","Host":"httpbin.kong.svc.cluster.local:8000","User-Agent":"curl/8.7.1","X-Forwarded-Host":"127.0.0.1","X-Forwarded-Path":"/httpbin-route/get","X-Forwarded-Prefix":"/httpbin-route","X-Kong-Request-Id":"2228de44dadd2e6126d82c4fb2e43961"},"origin":"10.244.0.1","url":"http://httpbin.kong.svc.cluster.local:8000/get"}
* Connection #0 to host 127.0.0.1 left intact
```

### Enabling a Kong Plugin on a Kong Route

Now, we are going to define a Rate Limiting policy for our Service. This time, you are going to enable the **Rate Limiting** plugin to the Kong Route, not to the Kong Gateway Service. In this sense, new Routes defined for the Service will not have the Rate Limiting plugin enabled, only the Proxy Caching.

{{<highlight>}}
cat > httpbin.yaml << 'EOF'
_format_version: "3.0"
_konnect:
  control_plane_name: kong-workshop
_info:
  select_tags:
  - httpbin-service-route
services:
- name: httpbin-service
  tags:
  - httpbin-service-route
  host: httpbin.kong.svc.cluster.local
  port: 8000
  plugins:
  - name: proxy-cache
    config:
      strategy: memory
      cache_ttl: 30
  routes:
  - name: httpbin-route
    tags:
    - httpbin-service-route
    paths:
    - /httpbin-route
    plugins:
    - name: rate-limiting
      instance_name: rate-limiting1
      config:
        minute: 3
EOF
{{</highlight>}}

The configuration includes:
* **minute** as ``3``, which means the Route can be consumed only 3 times a given minute.



#### Submit the declaration
{{<highlight>}}
deck gateway sync --konnect-token $PAT httpbin.yaml
{{</highlight>}}


#### Consume the Service

If you consume the service again, you'll see, besides the caching related headers, new ones describing the status of current rate limiting policy:

{{<highlight>}}
curl -v $DATA_PLANE_LB/httpbin-route/get
{{</highlight>}}

```
*   Trying 127.0.0.1:80...
* Connected to 127.0.0.1 (127.0.0.1) port 80
> GET /httpbin-route/get HTTP/1.1
> Host: 127.0.0.1
> User-Agent: curl/8.7.1
> Accept: */*
> 
* Request completely sent off
< HTTP/1.1 200 OK
< Content-Type: application/json
< Content-Length: 377
< Connection: keep-alive
< X-RateLimit-Limit-Minute: 3
< RateLimit-Remaining: 2
< RateLimit-Reset: 32
< RateLimit-Limit: 3
< X-RateLimit-Remaining-Minute: 2
< X-Cache-Key: a00008105a989fd0fa8a1eeeee08924b7205d24ed1adee71698926c12a31f2b7
< X-Cache-Status: Miss
< Server: gunicorn
< Date: Mon, 11 Aug 2025 14:41:28 GMT
< Access-Control-Allow-Origin: *
< Access-Control-Allow-Credentials: true
< X-Kong-Upstream-Latency: 1
< X-Kong-Proxy-Latency: 5
< Via: 1.1 kong/3.11.0.2-enterprise-edition
< X-Kong-Request-Id: 882b11008e7ddd2eff471a433576524d
< 
{"args":{},"headers":{"Accept":"*/*","Connection":"keep-alive","Host":"httpbin.kong.svc.cluster.local:8000","User-Agent":"curl/8.7.1","X-Forwarded-Host":"127.0.0.1","X-Forwarded-Path":"/httpbin-route/get","X-Forwarded-Prefix":"/httpbin-route","X-Kong-Request-Id":"882b11008e7ddd2eff471a433576524d"},"origin":"10.244.0.1","url":"http://httpbin.kong.svc.cluster.local:8000/get"}
* Connection #0 to host 127.0.0.1 left intact
```


If you keep sending new requests to the Runtime Instance, eventually, you'll get a **429** error code, meaning you have reached the consumption rate limiting policy for this Route.

```
curl -v $DATA_PLANE_LB/httpbin-route/get
*   Trying 127.0.0.1:80...
* Connected to 127.0.0.1 (127.0.0.1) port 80
> GET /httpbin-route/get HTTP/1.1
> Host: 127.0.0.1
> User-Agent: curl/8.7.1
> Accept: */*
> 
* Request completely sent off
< HTTP/1.1 429 Too Many Requests
< Date: Mon, 11 Aug 2025 14:41:58 GMT
< Content-Type: application/json; charset=utf-8
< Connection: keep-alive
< X-RateLimit-Limit-Minute: 3
< X-RateLimit-Remaining-Minute: 0
< RateLimit-Reset: 2
< Retry-After: 2
< RateLimit-Remaining: 0
< RateLimit-Limit: 3
< Content-Length: 92
< X-Kong-Response-Latency: 1
< Server: kong/3.11.0.2-enterprise-edition
< X-Kong-Request-Id: ce56eb67161a85678126a00ef59e6159
< 
{
  "message":"API rate limit exceeded",
  "request_id":"ce56eb67161a85678126a00ef59e6159"
* Connection #0 to host 127.0.0.1 left intact
}
```

### Enabling a Kong Plugin globally

Besides scoping a plugin to a Kong Service or Route, we can apply it globally also. When we do it so, all Services ans Routes will enforce the police described by the plugin.

For example, let's apply the Proxy Caching plugin globally.

{{<highlight>}}
cat > httpbin.yaml << 'EOF'
_format_version: "3.0"
_konnect:
  control_plane_name: kong-workshop
_info:
  select_tags:
  - httpbin-service-route
plugins:
- name: proxy-cache
  config:
    strategy: memory
    cache_ttl: 30
services:
- name: httpbin-service
  tags:
  - httpbin-service-route
  host: httpbin.kong.svc.cluster.local
  port: 8000
  routes:
  - name: httpbin-route
    tags:
    - httpbin-service-route
    paths:
    - /httpbin-route
    plugins:
    - name: rate-limiting
      instance_name: rate-limiting1
      config:
        minute: 3
EOF
{{</highlight>}}


#### Submit the declaration
{{<highlight>}}
deck gateway sync --konnect-token $PAT httpbin.yaml
{{</highlight>}}

After testing the configuration reset the Control Plane:

{{<highlight>}}
deck gateway reset --konnect-control-plane-name kong-workshop --konnect-token $PAT -f
{{</highlight>}}




Kong-gratulations! have now reached the end of this module by caching API responses. You can now click **Next** to proceed with the next module.
