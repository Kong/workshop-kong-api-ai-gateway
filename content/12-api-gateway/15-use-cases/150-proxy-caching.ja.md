---
title : "プロキシキャッシュ"
weight : 150
---

[Proxy Caching](https://docs.konghq.com/hub/kong-inc/proxy-cache/) は、Kong Gateway 用のプロキシ・キャッシュ機能を提供します。レスポンスコードとコンテンツタイプ、およびリクエストメソッドに基づいてレスポンスをキャッシュします。Consumer 単位または API 単位でキャッシュできます。キャッシュは設定した期間保存され、その後同じリソースへのリクエストがあると、キャッシュが利用されレスポンスを返します。キャッシュは、有効期限が切れる前に Admin API で強制的に削除することもできます。

#### 実装

**Gateway Services** に移動し、前回作成した Kong Gateway Service ``service1`` を選択します。**Plugins** タブをクリックし、**+ New Plugin** ボタンをクリックします。**Select a Plugin** ページで、**Traffic control** の **View more** をクリックします：

![proxy_cache](/static/images/plugins.png)

**Proxy Caching** のアイコンをクリックし、以下を行います:
* **Cache Ttl** に ``30`` と入力します。この制限時間に達すると、全てのキャッシュデータはクリアされます。
* **Strategy** で ``memory`` を選択します。プラグインはランタイムインスタンスのメモリを使用してキャッシュを保存します。


![proxy_cache](/static/images/proxy_cache.png)

**Save** をクリックします。

#### Service へのアクセス

サービスに再度アクセスすると、キャッシュの状態を示す新しいヘッダーがいくつか表示されます：

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

最初のリクエストでは、**X-Cache-Status** ヘッダーに **Miss** が返され、これはランタイムインスタンス内に利用可能なキャッシュが存在しないため、実際の API である ``httpbin.org`` に接続しなければならなかったことを意味しています。

もう一つ新しいリクエストを送ると、ランタイムインスタンスはリクエストに該当するキャッシュを持っているので、ステータスは **Hit** となります。レイテンシかなり短縮されたことに注目してください。

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

#### Kong Route に対するプラグインの有効化

次に、Service に対し流量制限のポリシーを定義します。今回は、Kong Gateway Service ではなく、Kong Route に対して **Rate Limiting** プラグインを有効にします。この場合、Service に定義された新しい Route では、Rate Limiting プラグインは有効にならず、Proxy Caching のみが有効になります。

再び **Gateway Manager** に戻り、``service1`` を選択し、**Routes** タブをクリックし、``route1`` Route を選択します。そして **Plugins** タブの下にある **+ New Plugin** をクリックします。

**Rate Limiting** プラグインは同じ **Traffic control** プラグインセクションの下にあります。

**Configure plugin: rate limiting** の画面で：
* **Minute** に３を入力します。これは、Route が1分間に3回しか利用できないことを意味します。

![rate_limiting](/static/images/rate_limiting.png)

**Save** をクリックします。

#### Service にアクセスする

サービスへ再度アクセスすると、キャッシュ関連のヘッダーの他に、現在の流量制限ポリシーのステータスを示す新しいヘッダーが表示されます：

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


新しいリクエストを送信し続けると、最終的に **429**エラーコードが表示され、この Route の流量制限ポリシーに達したことを示します。

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

### Kong Plugin をグローバルに有効化する

Plugin をKong Service または Route に限定する他に、グローバルに適用することもできます。そうすると、すべての Service および Route で Plugin で定義したポリシーが適用されます。

試しに Proxy Caching プラグインをグローバルに適用してみましょう。**Gateway Manager** メニューから ``default`` Runtime Group を選択します。**Plugins** メニューをクリックします。先ほど設定した両方のプラグインが表示されるはずです。それぞれの有効範囲が **Applied To** 列に記述されています。

**Proxy Caching** プラグインの右側にある三つの点の **Actions** をクリックして削除します。

**+ New Plugin** をクリックします。再び **Proxy Caching** を選択し、先ほどと同じように設定します。同じプラグインが異なるスコープで表示されるはずです：

![proxy_cache_global](/static/images/proxy_cache_global.png)

Kong-gratulations!API レスポンスをキャッシュしたので、このセクションは完了です。次のセクションに進むには、**Next** をクリックしてください。
