---
title : "代理快取"
weight : 150
---

[Proxy Caching](https://docs.konghq.com/hub/kong-inc/proxy-cache/) 為 Kong 提供反向代理快取實作。它根據可設定的回應代碼、內容類型以及請求方法來快取回應實體。它可以為每個客戶或每個應用程式介面進行快取。快取實體會儲存一段可設定的時間，之後對相同資源的後續請求將重新擷取並儲存該資源。快取實體也可以在到期前透過管理 API 強制清除。

#### 實施


進入**Gateway Service**，選擇我們之前創建的 Kong Gateway 服務``service1``。單擊**Plugins**選項卡和 **+ New Plugin** 按鈕。在 **Select a Plugin** 頁面，單擊 **View more**，選擇 **Traffic control**插件集合：


![proxy_cache](/static/images/plugins.png)

點擊 **Proxy Caching** 插件圖標。對於
* **Cache Ttl** 設置為 ``30``，這意味著插件將清除達到此時間限制的所有數據。
* **Strategy** 選擇 ``memory``。插件將使用runtime instance的內存來實現緩存。


![proxy_cache](/static/images/proxy_cache.png)

點擊 **Save**


#### 訪問 Service

如果再次訪問該服務，就會看到一些描述緩存狀態的新Header：

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

請注意，第一個請求的**X-Cache-Status** Header為 **Miss**，這意味著data plane的緩存中沒有任何可用數據，因此必須連接到上游服務``httpbin.org``。

如果我們發送一個新請求，data plane就能滿足該請求的所有需求，因此狀態為 **Hit**。請注意，延遲時間已大大減少。

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

#### 在 Kong Route 上啟用 Kong 插件

現在，我們將定義一個速率限制策略。這次，您將啟用**Rate Limiting**插件到Kong Route，而不是到Kong Gateway Service。在這種情況下，為服務定義的新Route將不會啟用速率限制插件，除非啟用了代理緩存插件。

返回**Gateway Manager**，選擇您的``service1``。單擊**Routes**選項卡並選擇``route1`` Route。在**Plugins**選項卡下點擊 **+ New Plugin**。

**Rate Limiting** 插件在同一個 **Traffic control** 插件部分。

在 **Configure plugin: rate limiting** 頁面：
* **Minute** 設置為 ``3``，這意味著Route每分鐘只能被消費3次。

![rate_limiting](/static/images/rate_limiting.png)

點擊 **Save**

#### 訪問 Service

如果再次訪問該服務，您將看到，除了緩存相關的Header，還有描述當前速率限制策略的新Header：

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


如果持續向Runtime Instance發送新請求，最終您將收到**429**錯誤代碼，這意味著您已達到該Route的消費速率限制策略。

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

### 全局啟用 Kong 插件

除了將插件作用域限制為Kong Service或Route，我們還可以全局應用它。當我們這樣做時，所有服務和Route都將強制執行插件描述的策略。

例如，讓我們全局應用**Proxy Caching**插件。進入**Gateway Manager**菜單選項，選擇``default``運行時間群組。單擊 **Plugins** 菜單選項。您應該可以看到我們之前設定的兩個外掛程式。請注意 **Applied To** 欄中每個外掛程式的作用範圍。

點擊 **Proxy Caching**插件的 **Actions**，並將其刪除。

單擊 **+ New Plugin**。再次選擇 **Proxy Caching**，然後就像之前一樣進行設定。您應該會看到範圍不同的相同插件：

![proxy_cache_global](/static/images/proxy_cache_global.png)

恭喜您！現在已經到達本模組的結束點 - 快取 API 回應。現在您可以按一下 **Next** 繼續下一個模組。
