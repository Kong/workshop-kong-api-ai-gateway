---
title : "Proxy Caching"
weight : 150
---

[Proxy Caching](https://docs.konghq.com/hub/kong-inc/proxy-cache/) provides a reverse proxy cache implementation for Kong. It caches response entities based on configurable response code and content type, as well as request method. It can cache per-Consumer or per-API. Cache entities are stored for a configurable period of time, after which subsequent requests to the same resource will re-fetch and re-store the resource. Cache entities can also be forcefully purged via the Admin API prior to their expiration time.

### Kong Gateway Plugin list

Before enabling the **Proxy Caching**, let's check the list of plugins Konnect provides. Inside the ``kong-aws`` Control Plane, click on **Plugins** menu option and **+ New plugin**. You should the following page with all plugins available:

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
* Host a06491acb99f64d0481263f3536909da-1064984904.us-east-2.elb.amazonaws.com:80 was resolved.
* IPv6: (none)
* IPv4: 3.12.182.158, 18.216.117.235
*   Trying 3.12.182.158:80...
* Connected to a06491acb99f64d0481263f3536909da-1064984904.us-east-2.elb.amazonaws.com (3.12.182.158) port 80
> GET /httpbin-route/get HTTP/1.1
> Host: a06491acb99f64d0481263f3536909da-1064984904.us-east-2.elb.amazonaws.com
> User-Agent: curl/8.7.1
> Accept: */*
> 
* Request completely sent off
< HTTP/1.1 200 OK
< Content-Type: application/json
< Content-Length: 443
< Connection: keep-alive
< X-Cache-Key: 631505758a8c7ccfea4694d7b0164f6b4deaebc64c36c906813c79ba4ab906f3
< X-Cache-Status: Miss
< Server: gunicorn
< Date: Tue, 27 May 2025 22:37:06 GMT
< Access-Control-Allow-Origin: *
< Access-Control-Allow-Credentials: true
< X-Kong-Upstream-Latency: 2
< X-Kong-Proxy-Latency: 1
< Via: 1.1 kong/3.10.0.1-enterprise-edition
< X-Kong-Request-Id: eda0954efb9dc903147b4325b0a73563
< 
{"args":{},"headers":{"Accept":"*/*","Connection":"keep-alive","Host":"httpbin.kong.svc.cluster.local:8000","User-Agent":"curl/8.7.1","X-Forwarded-Host":"a06491acb99f64d0481263f3536909da-1064984904.us-east-2.elb.amazonaws.com","X-Forwarded-Path":"/httpbin-route/get","X-Forwarded-Prefix":"/httpbin-route","X-Kong-Request-Id":"eda0954efb9dc903147b4325b0a73563"},"origin":"192.168.61.217","url":"http://httpbin.kong.svc.cluster.local:8000/get"}
* Connection #0 to host a06491acb99f64d0481263f3536909da-1064984904.us-east-2.elb.amazonaws.com left intact
```

Notice that, for the first request we get **Miss** for the **X-Cache-Status** header, meaning that the Runtime Instance didn't have any data avaialble in the cache and had to connect to the Upstream Service, ``httpbin.org``.

If we send a new request, the Runtime Instance has all it needs to satify the request, therefore the status is **Hit**. Note that the latency time has dropped considerably.

```
# curl -v $DATA_PLANE_LB/httpbin-route/get
* Host a06491acb99f64d0481263f3536909da-1064984904.us-east-2.elb.amazonaws.com:80 was resolved.
* IPv6: (none)
* IPv4: 18.216.117.235, 3.12.182.158
*   Trying 18.216.117.235:80...
* Connected to a06491acb99f64d0481263f3536909da-1064984904.us-east-2.elb.amazonaws.com (18.216.117.235) port 80
> GET /httpbin-route/get HTTP/1.1
> Host: a06491acb99f64d0481263f3536909da-1064984904.us-east-2.elb.amazonaws.com
> User-Agent: curl/8.7.1
> Accept: */*
> 
* Request completely sent off
< HTTP/1.1 200 OK
< Content-Type: application/json
< Connection: keep-alive
< X-Cache-Key: 631505758a8c7ccfea4694d7b0164f6b4deaebc64c36c906813c79ba4ab906f3
< Access-Control-Allow-Credentials: true
< age: 2
< X-Cache-Status: Hit
< Access-Control-Allow-Origin: *
< Server: gunicorn
< Date: Tue, 27 May 2025 22:37:06 GMT
< Content-Length: 443
< X-Kong-Upstream-Latency: 0
< X-Kong-Proxy-Latency: 1
< Via: 1.1 kong/3.10.0.1-enterprise-edition
< X-Kong-Request-Id: d148241a9c5e904a0b68235008315038
< 
{"args":{},"headers":{"Accept":"*/*","Connection":"keep-alive","Host":"httpbin.kong.svc.cluster.local:8000","User-Agent":"curl/8.7.1","X-Forwarded-Host":"a06491acb99f64d0481263f3536909da-1064984904.us-east-2.elb.amazonaws.com","X-Forwarded-Path":"/httpbin-route/get","X-Forwarded-Prefix":"/httpbin-route","X-Kong-Request-Id":"eda0954efb9dc903147b4325b0a73563"},"origin":"192.168.61.217","url":"http://httpbin.kong.svc.cluster.local:8000/get"}
* Connection #0 to host a06491acb99f64d0481263f3536909da-1064984904.us-east-2.elb.amazonaws.com left intact
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
* Host a06491acb99f64d0481263f3536909da-1064984904.us-east-2.elb.amazonaws.com:80 was resolved.
* IPv6: (none)
* IPv4: 3.12.182.158, 18.216.117.235
*   Trying 3.12.182.158:80...
* Connected to a06491acb99f64d0481263f3536909da-1064984904.us-east-2.elb.amazonaws.com (3.12.182.158) port 80
> GET /httpbin-route/get HTTP/1.1
> Host: a06491acb99f64d0481263f3536909da-1064984904.us-east-2.elb.amazonaws.com
> User-Agent: curl/8.7.1
> Accept: */*
> 
* Request completely sent off
< HTTP/1.1 200 OK
< Content-Type: application/json
< Content-Length: 443
< Connection: keep-alive
< RateLimit-Limit: 3
< RateLimit-Reset: 51
< X-RateLimit-Remaining-Minute: 2
< X-RateLimit-Limit-Minute: 3
< RateLimit-Remaining: 2
< X-Cache-Key: 631505758a8c7ccfea4694d7b0164f6b4deaebc64c36c906813c79ba4ab906f3
< X-Cache-Status: Miss
< Server: gunicorn
< Date: Tue, 27 May 2025 22:39:09 GMT
< Access-Control-Allow-Origin: *
< Access-Control-Allow-Credentials: true
< X-Kong-Upstream-Latency: 2
< X-Kong-Proxy-Latency: 2
< Via: 1.1 kong/3.10.0.1-enterprise-edition
< X-Kong-Request-Id: de0e817681d25556c8cfd01fcbaf1645
< 
{"args":{},"headers":{"Accept":"*/*","Connection":"keep-alive","Host":"httpbin.kong.svc.cluster.local:8000","User-Agent":"curl/8.7.1","X-Forwarded-Host":"a06491acb99f64d0481263f3536909da-1064984904.us-east-2.elb.amazonaws.com","X-Forwarded-Path":"/httpbin-route/get","X-Forwarded-Prefix":"/httpbin-route","X-Kong-Request-Id":"de0e817681d25556c8cfd01fcbaf1645"},"origin":"192.168.61.217","url":"http://httpbin.kong.svc.cluster.local:8000/get"}
* Connection #0 to host a06491acb99f64d0481263f3536909da-1064984904.us-east-2.elb.amazonaws.com left intact
```


If you keep sending new requests to the Runtime Instance, eventually, you'll get a **429** error code, meaning you have reached the consumption rate limiting policy for this Route.

```
curl -v $DATA_PLANE_LB/httpbin-route/get
* Host a06491acb99f64d0481263f3536909da-1064984904.us-east-2.elb.amazonaws.com:80 was resolved.
* IPv6: (none)
* IPv4: 3.12.182.158, 18.216.117.235
*   Trying 3.12.182.158:80...
* Connected to a06491acb99f64d0481263f3536909da-1064984904.us-east-2.elb.amazonaws.com (3.12.182.158) port 80
> GET /httpbin-route/get HTTP/1.1
> Host: a06491acb99f64d0481263f3536909da-1064984904.us-east-2.elb.amazonaws.com
> User-Agent: curl/8.7.1
> Accept: */*
> 
* Request completely sent off
< HTTP/1.1 429 Too Many Requests
< Date: Tue, 27 May 2025 22:39:15 GMT
< Content-Type: application/json; charset=utf-8
< Connection: keep-alive
< RateLimit-Limit: 3
< Retry-After: 45
< RateLimit-Reset: 45
< RateLimit-Remaining: 0
< X-RateLimit-Limit-Minute: 3
< X-RateLimit-Remaining-Minute: 0
< Content-Length: 92
< X-Kong-Response-Latency: 0
< Server: kong/3.10.0.1-enterprise-edition
< X-Kong-Request-Id: 78a9a40f86bf6f7856ea932ce3bf2029
< 
{
  "message":"API rate limit exceeded",
  "request_id":"78a9a40f86bf6f7856ea932ce3bf2029"
* Connection #0 to host a06491acb99f64d0481263f3536909da-1064984904.us-east-2.elb.amazonaws.com left intact
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
deck gateway reset --konnect-control-plane-name kong-aws --konnect-token $PAT -f
{{</highlight>}}




Kong-gratulations! have now reached the end of this module by caching API responses. You can now click **Next** to proceed with the next module.
