---
title : "レスポンス変換"
weight : 153
---

[Response-Transformer](https://docs.konghq.com/hub/kong-inc/response-transformer/) プラグインは、アップストリームのレスポンス (サーバーからのレスポンスなど) をクライアントに返す前に変更することができます。

このセクションでは、Kong Route で Response-Transformer プラグインを設定します。具体的には、クライアントに応答する前に新しいヘッダー「demo: injected-by-kong」を追加するように Kong Konnect を設定します。

#### Response Transformer プラグインの作成

**route1** の設定ページに移動します。 **Plugins** タブで、**+ New Plugin** ボタンをクリックします。**Select a Plugin** ページで、**Transformations** セクションの **Response Transformer** プラグインをクリックします。

**Configure plugin: response transformer** ページで **Add.Headers** を ``demo: injected-by-kong`` と設定し、保存します。

Route には2つのプラグインが表示されるはずです：

![response_transformer](/static/images/response_transformer.png)


### 確認

**route1** に対しリクエストを送信して確認しましょう。

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


**期待される結果**  
ヘッダーに ``demo: injected-by-kong`` が追加されています。

#### クリーンアップ

``route1`` で有効にしたプラグインを削除してください。クリーンアップすることで、プラグインがワークショップの他のセクションと干渉せず、各セクションのコードが独立して機能し続けるようになります。

実際のユースケースでは、要件に応じて好きなだけプラグインを有効にすることができます。

Kong-gratulations!クライアントに応答する前に ``demo: injected-by-kong`` を追加したので、このセクションは完了です。次のセクションに進むには、**Next** をクリックします。
