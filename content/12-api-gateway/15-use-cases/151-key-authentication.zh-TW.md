---
title : "API 密鑰認證"
weight : 151
---

一個 Kong Consumer代表一個服務的consumer（用戶或應用程式）。Kong Consumer 與Kong Gateway提供的驗證機制緊密相連。

要開始使用 API Authentication 和 Kong Consumer，我們先來實現一個基本的密鑰認證機制。API 密鑰是 Konnect 提供的基本安全機制之一。為了使用 API，consumer應在請求頭中注入一個事先創建的 API 密鑰。如果網關能識別 API 密鑰，就可以使用 API。


#### 在 Kong Route 上啟用密鑰驗證插件

為了使操作更簡單、更具體，讓我們在路由上啟用密鑰驗證插件。

使用**Gateway Manager**菜單選項，轉到我們的``route1``路由。在 **Plugins** 選項卡下，點擊 **+ New Plugin** 按鈕，然後點擊 **Authentication** 部分中的 **View more** 連結。

點擊**Key Authentication**插件。請記住，**Key Names**配置設置為 ``apikey``。接受所有默認值，然後點擊**Save**。

您將看到啟用了兩個插件的路由：現有的**Rate Limiting**和新的**Key Authentication**：

![key_authentication](/static/images/key_authentication.png)


#### 訪問 Route

現在，如果您嘗試訪問路由，就會得到一個特定的 **401** 錯誤代碼，意思是由於您的請求中沒有注入任何 API 密鑰，因此不允許您使用它。

:::code{showCopyAction=true showLineNumbers=false language=shell}
curl $DATA_PLANE_LB/route1/get
:::

```
HTTP/1.1 401 Unauthorized
Date: Mon, 05 Jun 2023 20:41:53 GMT
Content-Type: application/json; charset=utf-8
Connection: keep-alive
WWW-Authenticate: Key realm="kong"
Content-Length: 45
X-Kong-Response-Latency: 1
Server: kong/3.3.0.0-enterprise-edition
```


#### 創建一個 Kong Consumer

進入**Gateway Manager**，選擇 ``default``運行時組。單擊**Consumers**子菜單選項，然後單擊 **+Consumers**按鈕。

在**Username**中鍵入**consumer1**。這不是一個憑證，而只是 Kong Gateway 管理員引用指定 Kong consumer的一種方式。

![consumer](/static/images/consumer.png)

保存它。然後應該會重定向到**Consumers**頁面。單擊您剛剛創建的``consumer1``，然後在**Credentials**選項卡中。在選項卡中，選擇**Key Authentication**，然後單擊 **+ New Key Auth Credential** 按鈕。

在**Create Key Auth Credential**頁面中，您可以輸入任何密鑰。如果您將 **Key** 欄位留空，Konnect 將生成一個隨機密鑰。為您的密鑰輸入 ``123456``。保存它。

再次單擊**Key Authentication**選項。您應該會看到帶有第一個憑證的consumer。

![consumer_key](/static/images/consumer_key.png)


#### 使用 API 密鑰訪問 Route

現在，您需要將剛剛創建的密鑰作為頭注入到您的請求中。使用 HTTPie，您可以輕鬆地這樣做：

:::code{showCopyAction=true showLineNumbers=false language=shell}
curl --head $DATA_PLANE_LB/route1/get --head -H 'apikey:123456'
:::

```
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 705
Connection: keep-alive
X-RateLimit-Remaining-Minute: 2
RateLimit-Remaining: 2
RateLimit-Limit: 3
RateLimit-Reset: 41
X-RateLimit-Limit-Minute: 3
X-Cache-Key: 1789b8a51c844bebf5989ee69ef91f7311e467bdd517e60dd97a451982d2b2bc
X-Cache-Status: Miss
Date: Mon, 06 Feb 2023 13:46:20 GMT
Server: gunicorn/19.9.0
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true
X-Kong-Upstream-Latency: 2
X-Kong-Proxy-Latency: 305
Via: kong/3.1.1.3-enterprise-edition
```

當然，如果您注入錯誤的密鑰，您會得到一個特定的錯誤，如下所示：

```
# curl --head $DATA_PLANE_LB/route1/get --head -H 'apikey:12'
HTTP/1.1 401 Unauthorized
Date: Mon, 06 Feb 2023 13:47:34 GMT
Content-Type: application/json; charset=utf-8
Connection: keep-alive
Content-Length: 52
X-Kong-Response-Latency: 0
Server: kong/3.1.1.3-enterprise-edition
```


**注意**

* Header必須包含 API 密鑰名稱，在我們的例子中是 ``apikey``。這是您在啟用**Key Authentication**時，Konnect 提供的默認名稱。您可以更改插件配置，如果需要的話。
* 請注意，其他策略，由現有的**Proxy Cache**和**Rate Limiting**插件實施，正如預期的那樣，仍然被強制執行。


### Kong Consumer Policies

在 API 密鑰策略到位後，我們可以控制傳入的請求。然而，其他插件實施的策略與consumer無關。

因此，能夠為每個consumer定義特定的策略非常重要。例如，為不同的consumer定義速率限制策略會很有用：

* consumer1:
    * apikey = 123456
    * rate limiting policy = 5 rpm
* consumer2:
    * apikey = 987654
    * rate limiting policy = 8 rpm

這樣做，Data Plane 不僅可以保護路由，還可以根據注入的密鑰識別consumer，並根據consumer實施特定的策略。

對於本節，我們實施了一個速率限制策略。請記住，consumer可能還啟用了其他插件，如 [Request Transformer](https://docs.konghq.com/hub/kong-inc/request-transformer/)、[TCP Log](https://docs.konghq.com/hub/kong-inc/tcp-log/) 等。


#### 新Consumer

為了使策略到位，讓我們刪除現有的速率限制插件。最簡單的方法是進入``default`` **Runtime Group** 並刪除**Rate Limiting**插件。

然後，創建第二個``consumer2``，就像您對``consumer1``所做的那樣，使用``987654``密鑰。

如果您願意，您可以向您的請求注入這兩個密鑰。

:::code{showCopyAction=true showLineNumbers=false language=shell}
curl --head $DATA_PLANE_LB/route1/get -H 'apikey:123456'
:::

or

:::code{showCopyAction=true showLineNumbers=false language=shell}
curl --head $DATA_PLANE_LB/route1/get -H 'apikey:987654'
:::


#### Consumer1 的策略

現在，讓我們為每個Consumer創建速率限制策略。進入**Consumer**菜單選項，選擇``consumer1``。單擊**Plugins**，然後單擊 **+ New Plugin**。

在**Traffic control**部分選擇**Rate Limiting**：

![rate_limiting2](/static/images/rate_limiting2.png)

請注意，Konnect 僅顯示適用於此上下文的插件。將**Minute**設置為5以實施我們的策略。保存它，然後單擊**Plugins**選項卡。您應該會看到``consumer1``的插件。

![consumer_plugin](/static/images/consumer_plugin.png)


#### Consumer2 的策略

創建一個新的插件，這次是為``consumer2``，將**Minute**設置為``8``。


#### 使用不同 API 密鑰的路由consumer。

首先，讓我們使用``consumer1`` 的 API 密鑰消費路由：

```
curl --head $DATA_PLANE_LB/route1/get -H 'apikey:123456'
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 705
Connection: keep-alive
X-RateLimit-Limit-Minute: 5
X-RateLimit-Remaining-Minute: 4
RateLimit-Reset: 45
RateLimit-Remaining: 4
RateLimit-Limit: 5
X-Cache-Key: 1789b8a51c844bebf5989ee69ef91f7311e467bdd517e60dd97a451982d2b2bc
X-Cache-Status: Miss
Date: Mon, 06 Feb 2023 15:48:15 GMT
Server: gunicorn/19.9.0
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true
X-Kong-Upstream-Latency: 6
X-Kong-Proxy-Latency: 57
Via: kong/3.1.1.3-enterprise-edition
```

現在，讓我們使用 ``consumer2`` 的 API Key 來消費它。可以看到，Data Plane 正在獨立處理速率限制進程。

```
# curl --head $DATA_PLANE_LB/route1/get -H 'apikey:987654'
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 705
Connection: keep-alive
X-RateLimit-Limit-Minute: 8
X-RateLimit-Remaining-Minute: 7
RateLimit-Reset: 37
RateLimit-Remaining: 7
RateLimit-Limit: 8
X-Cache-Key: 416fddbc351fdc6f904699fb6ddb58760678e92e246f506d3c83a266bdfa4311
X-Cache-Status: Miss
Date: Mon, 06 Feb 2023 15:48:24 GMT
Server: gunicorn/19.9.0
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true
X-Kong-Upstream-Latency: 1197
X-Kong-Proxy-Latency: 1
Via: kong/3.1.1.3-enterprise-edition
```

如果我們繼續使用第一個 API 密鑰發送請求，最終，正如預期的那樣，我們會得到一個錯誤代碼：

```
# curl --head $DATA_PLANE_LB/route1/get -H 'apikey:123456'
HTTP/1.1 429 Too Many Requests
Date: Mon, 06 Feb 2023 15:48:38 GMT
Content-Type: application/json; charset=utf-8
Connection: keep-alive
X-RateLimit-Limit-Minute: 5
Retry-After: 22
X-RateLimit-Remaining-Minute: 0
RateLimit-Reset: 22
RateLimit-Remaining: 0
RateLimit-Limit: 5
Content-Length: 41
X-Kong-Response-Latency: 0
Server: kong/3.1.1.3-enterprise-edition
```

不過，第二個 API 密鑰仍可使用 Kong Route：

```
# curl --head $DATA_PLANE_LB/route1/get -H 'apikey:987654'
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 705
Connection: keep-alive
X-RateLimit-Limit-Minute: 8
X-RateLimit-Remaining-Minute: 6
RateLimit-Reset: 13
RateLimit-Remaining: 6
RateLimit-Limit: 8
X-Cache-Key: 416fddbc351fdc6f904699fb6ddb58760678e92e246f506d3c83a266bdfa4311
X-Cache-Status: Miss
Date: Mon, 06 Feb 2023 15:48:47 GMT
Server: gunicorn/19.9.0
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true
X-Kong-Upstream-Latency: 221
X-Kong-Proxy-Latency: 1
Via: kong/3.1.1.3-enterprise-edition
```

恭喜！通過使用密鑰驗證 API 請求並將不同Consumer與策略計劃關聯起來，本模塊現已結束。現在您可以點擊**Next**，繼續下一個模塊。

#### 可選閱讀

在服務、路由或全局應用 Kong 插件有助於我們在 API Gateway 層實施一系列策略。但是，到目前為止，我們還沒有控制向 Data Plane 發送請求的對象。也就是說，任何擁有運行時實例 ELB 地址的人都可以向它發送請求並使用服務。

API 網關驗證是控制允許使用 API 傳輸數據的重要方法。基本上，它使用一組預定義的憑據來檢查特定consumer是否有訪問 API 的權限。

Kong Gateway 有一個插件庫，可提供簡單的方法來實現最著名和最廣泛使用的 API 網關身份驗證方法。下面是一些常用的方法：

* 基本認證
* 密鑰驗證
* OAuth 2.0 身份驗證
* LDAP 身份驗證
* OpenID 連接

Kong Plugin Hub 提供有關所有基於 [驗證](https://docs.konghq.com/hub/#authentication_) 的插件的文檔。請參閱以下連結，了解有關 [API Gateway Authentication](https://konghq.com/learning-center/api-gateway/api-gateway-authentication) 的更多信息