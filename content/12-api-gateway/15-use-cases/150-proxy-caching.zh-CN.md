---
title : "代理缓存"
weight : 150
---

[代理缓存](https://docs.konghq.com/hub/kong-inc/proxy-cache/) 为 Kong 提供了一个反向代理缓存实现。它根据可配置的响应代码和内容类型以及请求方法缓存响应实体。它可以按消费者或按应用程序接口进行缓存。缓存实体会存储一段可配置的时间，之后对同一资源的后续请求将重新获取并重新存储该资源。缓存实体也可以在过期前通过管理 API 强制清除。

#### 实施

进入**Gateway Service**，选择我们之前创建的 Kong Gateway 服务``service1``。单击**Plugins**选项卡和 **+ New Plugin** 按钮。在 **Select a Plugin** 页面，单击 **View more**，选择 **Traffic control**插件集合：

![proxy_cache](/static/images/plugins.png)

点击 **Proxy Caching** 插件图标。对于
* **Cache Ttl** 设置为 ``30``，这意味着插件将清除达到此时间限制的所有数据。
* **Strategy** 选择 ``memory``。插件将使用runtime instance的内存来实现缓存。


![proxy_cache](/static/images/proxy_cache.png)

点击 **Save**


#### 访问 Service

如果再次访问该服务，就会看到一些描述缓存状态的新Header：

:::code{showCopyAction=true showLineNumbers=false language=shell}
curl -v $DATA_PLANE_LB/route1/get
:::

```
*   Trying 13.57.65.227:80...
* Connected to ac916b2ee885743d6936cd6d5bec19b1-947248632.us-west-1.elb.amazonaws.com (13.57.65.227) port 80 (#0)
> GET /route1/get HTTP/1.1
> Host: ac916b2ee885743d6936cd6d5bec19b1-947248632.us-west-1.elb.amazonaws.com
> User-Agent: curl/7.88.1
> Accept: */*
> 
< HTTP/1.1 200 OK
< Content-Type: application/json
< Content-Length: 480
< Connection: keep-alive
< X-Cache-Key: e90274564efa1f26d9a366d7a55e27ffe8c7bca41a4f5aeaf4d9b08405919b38
< X-Cache-Status: Miss
< Server: gunicorn/19.9.0
< Date: Mon, 05 Jun 2023 20:20:08 GMT
< Access-Control-Allow-Origin: *
< Access-Control-Allow-Credentials: true
< X-Kong-Upstream-Latency: 2
< X-Kong-Proxy-Latency: 549
< Via: kong/3.3.0.0-enterprise-edition
< 
{
  "args": {}, 
  "headers": {
    "Accept": "*/*", 
    "Connection": "keep-alive", 
    "Host": "httpbin.kong.svc.cluster.local:8000", 
    "User-Agent": "curl/7.88.1", 
    "X-Forwarded-Host": "ac916b2ee885743d6936cd6d5bec19b1-947248632.us-west-1.elb.amazonaws.com", 
    "X-Forwarded-Path": "/route1/get", 
    "X-Forwarded-Prefix": "/route1"
  }, 
  "origin": "192.168.55.204", 
  "url": "http://ac916b2ee885743d6936cd6d5bec19b1-947248632.us-west-1.elb.amazonaws.com/get"
}
* Connection #0 to host ac916b2ee885743d6936cd6d5bec19b1-947248632.us-west-1.elb.amazonaws.com left intact
```

请注意，第一个请求的**X-Cache-Status** Header为 **Miss**，这意味着data plane的缓存中没有任何可用数据，因此必须连接到上游服务``httpbin.org``。

如果我们发送一个新请求，data plane就能满足该请求的所有需求，因此状态为 **Hit**。请注意，延迟时间已大大减少。

```
# curl -v $DATA_PLANE_LB/route1/get
*   Trying 54.183.108.128:80...
* Connected to ac916b2ee885743d6936cd6d5bec19b1-947248632.us-west-1.elb.amazonaws.com (54.183.108.128) port 80 (#0)
> GET /route1/get HTTP/1.1
> Host: ac916b2ee885743d6936cd6d5bec19b1-947248632.us-west-1.elb.amazonaws.com
> User-Agent: curl/7.88.1
> Accept: */*
> 
< HTTP/1.1 200 OK
< Content-Type: application/json
< Connection: keep-alive
< X-Cache-Key: e90274564efa1f26d9a366d7a55e27ffe8c7bca41a4f5aeaf4d9b08405919b38
< Date: Mon, 05 Jun 2023 20:20:08 GMT
< X-Cache-Status: Hit
< Access-Control-Allow-Credentials: true
< Server: gunicorn/19.9.0
< Age: 9
< Access-Control-Allow-Origin: *
< Content-Length: 480
< X-Kong-Upstream-Latency: 0
< X-Kong-Proxy-Latency: 0
< Via: kong/3.3.0.0-enterprise-edition
< 
{
  "args": {}, 
  "headers": {
    "Accept": "*/*", 
    "Connection": "keep-alive", 
    "Host": "httpbin.kong.svc.cluster.local:8000", 
    "User-Agent": "curl/7.88.1", 
    "X-Forwarded-Host": "ac916b2ee885743d6936cd6d5bec19b1-947248632.us-west-1.elb.amazonaws.com", 
    "X-Forwarded-Path": "/route1/get", 
    "X-Forwarded-Prefix": "/route1"
  }, 
  "origin": "192.168.55.204", 
  "url": "http://ac916b2ee885743d6936cd6d5bec19b1-947248632.us-west-1.elb.amazonaws.com/get"
}
* Connection #0 to host ac916b2ee885743d6936cd6d5bec19b1-947248632.us-west-1.elb.amazonaws.com left intact
```

#### 在 Kong Route 上启用 Kong 插件

现在，我们将为我们的服务定义一个速率限制策略。这次，您将启用**Rate Limiting**插件到Kong Route，而不是到Kong Gateway Service。在这种情况下，为服务定义的新Route将不会启用速率限制插件，除非启用了代理缓存插件。

返回**Gateway Manager**，选择您的``service1``。单击**Routes**选项卡并选择``route1`` Route。在**Plugins**选项卡下点击 **+ New Plugin**。

**Rate Limiting** 插件在同一个 **Traffic control** 插件部分。

在 **Configure plugin: rate limiting** 页面：
* **Minute** 设置为 ``3``，这意味着Route每分钟只能被消费3次。

![rate_limiting](/static/images/rate_limiting.png)

点击 **Save**

#### 访问 Service

如果再次访问该服务，您将看到，除了缓存相关的Header，还有描述当前速率限制策略的新Header：

:::code{showCopyAction=true showLineNumbers=false language=shell}
curl -v $DATA_PLANE_LB/route1/get
:::

```
$ curl -v $DATA_PLANE_LB/route1/get
*   Trying 13.57.65.227:80...
* Connected to ac916b2ee885743d6936cd6d5bec19b1-947248632.us-west-1.elb.amazonaws.com (13.57.65.227) port 80 (#0)
> GET /route1/get HTTP/1.1
> Host: ac916b2ee885743d6936cd6d5bec19b1-947248632.us-west-1.elb.amazonaws.com
> User-Agent: curl/7.88.1
> Accept: */*
> 
< HTTP/1.1 200 OK
< Content-Type: application/json
< Content-Length: 480
< Connection: keep-alive
< X-RateLimit-Limit-Minute: 3
< RateLimit-Limit: 3
< X-RateLimit-Remaining-Minute: 2
< RateLimit-Remaining: 2
< RateLimit-Reset: 57
< X-Cache-Key: e90274564efa1f26d9a366d7a55e27ffe8c7bca41a4f5aeaf4d9b08405919b38
< X-Cache-Status: Miss
< Server: gunicorn/19.9.0
< Date: Mon, 05 Jun 2023 20:28:03 GMT
< Access-Control-Allow-Origin: *
< Access-Control-Allow-Credentials: true
< X-Kong-Upstream-Latency: 2
< X-Kong-Proxy-Latency: 187
< Via: kong/3.3.0.0-enterprise-edition
< 
{
  "args": {}, 
  "headers": {
    "Accept": "*/*", 
    "Connection": "keep-alive", 
    "Host": "httpbin.kong.svc.cluster.local:8000", 
    "User-Agent": "curl/7.88.1", 
    "X-Forwarded-Host": "ac916b2ee885743d6936cd6d5bec19b1-947248632.us-west-1.elb.amazonaws.com", 
    "X-Forwarded-Path": "/route1/get", 
    "X-Forwarded-Prefix": "/route1"
  }, 
  "origin": "192.168.55.204", 
  "url": "http://ac916b2ee885743d6936cd6d5bec19b1-947248632.us-west-1.elb.amazonaws.com/get"
}
* Connection #0 to host ac916b2ee885743d6936cd6d5bec19b1-947248632.us-west-1.elb.amazonaws.com left intact
```

如果持续向Runtime Instance发送新请求，最终您将收到**429**错误代码，这意味着您已达到该Route的消费速率限制策略。

```
$ curl -v $DATA_PLANE_LB/route1/get
*   Trying 13.57.65.227:80...
* Connected to ac916b2ee885743d6936cd6d5bec19b1-947248632.us-west-1.elb.amazonaws.com (13.57.65.227) port 80 (#0)
> GET /route1/get HTTP/1.1
> Host: ac916b2ee885743d6936cd6d5bec19b1-947248632.us-west-1.elb.amazonaws.com
> User-Agent: curl/7.88.1
> Accept: */*
> 
< HTTP/1.1 429 Too Many Requests
< Date: Mon, 05 Jun 2023 20:28:15 GMT
< Content-Type: application/json; charset=utf-8
< Connection: keep-alive
< X-RateLimit-Limit-Minute: 3
< RateLimit-Limit: 3
< X-RateLimit-Remaining-Minute: 0
< RateLimit-Remaining: 0
< Retry-After: 45
< RateLimit-Reset: 45
< Content-Length: 41
< X-Kong-Response-Latency: 0
< Server: kong/3.3.0.0-enterprise-edition
< 
{
  "message":"API rate limit exceeded"
* Connection #0 to host ac916b2ee885743d6936cd6d5bec19b1-947248632.us-west-1.elb.amazonaws.com left intact
}
```

### 全局启用 Kong 插件

除了将插件作用域限制为Kong Service或Route，我们还可以全局应用它。当我们这样做时，所有服务和Route都将强制执行插件描述的策略。

例如，让我们全局应用**Proxy Caching**插件。进入**Gateway Manager**菜单选项，选择``default``运行时组。单击 **Plugins** 菜单选项。您应该会看到我们之前设置的两个插件。注意 **Applied To** 列中每个插件的作用域。

点击**Proxy Caching**插件的**Actions**并将其删除。

点击 **+ New Plugin**。再次选择**Proxy Caching**，然后像之前一样进行配置。你应该会看到范围不同的相同插件：

![proxy_cache_global](/static/images/proxy_cache_global.png)

恭喜！本模块已通过缓存 API 响应结束。现在您可以点击**Next**，继续下一个模块。
