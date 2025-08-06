---
title : "Response-Transformer 插件"
weight : 153
---

[Response-Transformer](https://docs.konghq.com/hub/kong-inc/response-transformer/) 插件在將上游響應（如來自伺服器的響應）返回給客戶端之前會對其進行修改。

在本節中，您將配置 Kong Route 上的 Response-Transformer 插件。具體來說，您將配置 Kong Konnect 在響應客戶端之前添加一個新的Header "demo: injected-by-kong"。

#### 創建Response Transformer 插件

進入**route1**配置頁面。在**Plugins**選項卡下，點擊 **+ New Plugin** 按鈕。在**選擇插件**頁面中，點擊**Transformations**部分中的**Response Transformer**插件。

在**Configure plugin: response transformer**頁面中，將 **Add.Headers** 設置為 ``demo: injected-by-kong`` 然後保存。


您應該能看到啟用了兩個插件的 Kong Route：

![response_transformer](/static/images/response_transformer.png)


### 驗證
測試以確保 Kong 將請求轉換到 echo 伺服器和 httpbin 伺服器。

:::code{showCopyAction=true showLineNumbers=false language=shell}
curl --head $DATA_PLANE_LB/route1/get -H 'apikey:123456'
:::

```
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 705
Connection: keep-alive
X-RateLimit-Limit-Minute: 400
X-RateLimit-Remaining-Minute: 380
RateLimit-Reset: 21
RateLimit-Remaining: 380
RateLimit-Limit: 400
X-Cache-Key: 1789b8a51c844bebf5989ee69ef91f7311e467bdd517e60dd97a451982d2b2bc
X-Cache-Status: Hit
Date: Mon, 06 Feb 2023 16:01:39 GMT
Server: gunicorn/19.9.0
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true
demo:  injected-by-kong
X-Kong-Upstream-Latency: 8
X-Kong-Proxy-Latency: 3
Via: kong/3.1.1.3-enterprise-edition
```


**預期結果** 注意，"demo: injected-by-kong" 已注入Header中。


#### 清理

刪除您為 ``route1`` 啟用的 Kong 插件。清理可確保插件不會干擾工作坊中用於演示的任何其他模塊，並且每個工作坊模塊代碼都能繼續獨立運行。

在實際應用中，您可以根據使用情況啟用任意數量的插件。

Kong-gratulations! 現在您可以點擊**Next**進入下一個模塊。