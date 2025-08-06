---
title : "API キー認証"
weight : 151
---

Kong Consumer は API にアクセスするユーザーまたはアプリケーションを表します。Kong Consumer は、Kong Gateway が提供する認証メカニズムと緊密に連携しています。

API 認証と Kong Consumer を利用するために、まずは基本的な Key Authentication の仕組みを実装してみましょう。API キーは Konnect が提供する基本的なセキュリティメカニズムの1つです。API を利用するには、Consumer はリクエストのヘッダーに事前に作成した API Key を挿入する必要があります。Kong Gateway が API キーを認識すると、API の利用が許可されます。

#### Kong Route で Key Authentication プラグインを有効化する

簡単かつ具体的に試せるように、Route レベルで Key Authentication プラグインを有効にしてみましょう。

**Gateway Manager** から、``route1`` Route の設定画面に移動します。**Plugins** タブで、**+ New Plugin** ボタンをクリックし、**Authentication** セクション内の **View more** をクリックします。

**Key Authentication** プラグインをクリックします。デフォルトの **Key Names** の設定は ``apikey`` になっていることに注意してください。すべてデフォルト値のまま、**Save** をクリックします。

既存の **Rate Limiting** と新しい **Key Authentication** の2つのプラグインが有効になったと表示されるはずです：

![key_authentication](/static/images/key_authentication.png)

#### Route にアクセスする

再度 Route にアクセスしてみると、**401**エラーコードが表示されます。これは、リクエストに API キーが挿入されていないため、API の利用が許可されていない状態です。

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


#### Kong Consumer の作成

**Gateway Manager** に移動し、``default`` Runtime Group を選択します。**Consumers** サブメニューをクリックし、**+ New Consumer** ボタンをクリックします。

**Username** に **consumer1** と入力します。これは認証情報ではなく、Kong Gateway 管理者が特定の Kong Consumer を参照するために利用するものです。

![consumer](/static/images/consumer.png)

保存してください。**Consumer** ページにリダイレクトされたら、先ほど作成した ``consumer1`` をクリックし、**Credentials** タブを開きます。タブ内で、**Key Authentication** を選択し、**+ New Key Auth Credential** ボタンをクリックします。

**Create Key Auth Credential** ページで、任意のキーを入力できます。**Key** フィールドを空にすると、Konnect がランダムなキーを生成します。今回はキーに ``123456`` と入力し、保存します。

**Key Authentication** オプションをもう一度クリックすると、最初の認証情報を持つ Consumer が表示されるはずです。

![consumer_key](/static/images/consumer_key.png)


#### API キーを利用して Route にアクセスする

さて、先ほど作成した Key をヘッダーとしてリクエストに挿入してみましょう。cURL を使えば、次のように簡単にできます：

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

もちろん、不正なキーを使用すると、次のようなエラーが発生します：
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

* ヘッダーには API キーの名前を指定する必要があり、デフォルトは ``apikey`` となります。これは、Kong Route で **Key Authentication** を有効にしたときに Konnect が提供したデフォルトの名前です。プラグインの設定でこのキーの名前を変更することができます。
* すでにお気づきかもしれませんが、既存の **Proxy Cache** および **Rate Limiting** プラグインによって実装された他のポリシーは、まだ有効になっている点に注目してください。

### Kong Consumer ポリシー

API Key ポリシーを利用すると、受信するリクエストを制御することができます。ただし、他のプラグインによって実装されたポリシーは、Consumer に関係なく同じままです。

そのため、Consumer ごとに特定のポリシーを定義できるという点が重要です。例えば、以下のように異なる Consumer に対して流量制限ポリシーが定義できると便利です：

* consumer1:
    * apikey = 123456
    * rate limiting policy = 5 rpm
* consumer2:
    * apikey = 987654
    * rate limiting policy = 8 rpm

これで、Data Planeは Route を保護するだけでなく、使われている API キーに基づいて Consumer を特定し、Consumer 固有のポリシーを適用することができます。

このセクションでは、流量制限ポリシーを実装します。Consumer には [Request Transformer](https://docs.konghq.com/hub/kong-inc/request-transformer/) や [TCP Log](https://docs.konghq.com/hub/kong-inc/tcp-log/) などの他のプラグインも有効になっている可能性があることを覚えておいてください。

#### 新規 Consumer の作成

ポリシーを導入するために、既存の Rate Limiting プラグインを削除しましょう。一番簡単な方法は、``default`` **Runtime Group** に移動して、**Rate Limiting** プラグインを削除することです。

次に、2つ目の ``consumer2`` を作成し、1つ目の時と同じように ``987654`` キーも作成します。

これで、2つのキーをリクエストに挿入することができる用になりました。
　　　　　　　　　　　　　　
:::code{showCopyAction=true showLineNumbers=false language=shell}
curl --head $DATA_PLANE_LB/route1/get -H 'apikey:123456'
:::

または

:::code{showCopyAction=true showLineNumbers=false language=shell}
curl --head $DATA_PLANE_LB/route1/get -H 'apikey:987654'
:::


#### Consumer1 用のポリシー

それでは、それぞれの Consumer に流量制限ポリシーを作成しましょう。**Consumers** メニューに移動し、``consumer1`` を選択します。**Plugins** をクリックし、**+ New Plugin** をクリックします。

**Traffic control** セクションで **Rate Limiting** を選択します：

![rate_limiting2](/static/images/rate_limiting2.png)

Konnect は、このコンテキストで利用可能なプラグインのみを表示することに注意してください。**Minute** に5を設定し、ポリシーを実装します。内容を保存して、**Plugins** タブをクリックすると、``consumer1`` のプラグインが表示されます。

![consumer_plugin](/static/images/consumer_plugin.png)


#### Consumer2 用のポリシー

次に ``consumer2`` 用に、**Minute** を ``8`` に設定して新しいプラグインを作成します。

#### それぞれの API キーを利用して Route にアクセスする

まず、Consumer1 の API Key で Route にアクセスします：

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

次に、Consumer2 の API Key を使って、Route にアクセスしてみます。以下の通り、Data Planeはそれぞれの Consumer に対して独立した Rate Limiting の処理を適用しています。

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

最初の API Key を使ってリクエストを送り続けると、想定通りエラーコードが返ってきます：

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

しかし、2つ目の API Key を使うと、Kong Route へのアクセスはまだ許可されたままです：

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

Kong-gratulations!API キーでリクエストを認証し、異なる Consumer を別々のポリシーに関連付け他ので、このセクションは完了です。次のセクションに進むには、**Next** をクリックしてください。

### 参考

Kong Plugin を Service、Route、またはグローバルに適用することで、API Gateway レイヤーに広範囲なポリシーを実装することができます。 しかし今のところ、誰がData Planeにリクエストを送るかは制御できていません。つまり、ランタイムインスタンスである ELB のアドレスを知っている人なら誰でも、ELB にリクエストを送信し、サービスを利用することができます。

API Gateway の認証は、API を使用して送信されるデータを制御する重要な方法です。基本的には、事前に定義された認証情報を使って、特定の Consumer が API にアクセスする権限を持っているかどうかをチェックします。

Kong Gateway には、最もよく知られ、広く使用されている認証方法を実装できるプラグインのライブラリがあります。よく利用されているものを以下に示します：

* Basic Authentication
* Key Authentication
* OAuth 2.0 Authentication
* LDAP Authentication
* OpenID Connect

Kong Plugin Hub では、[Authentication](https://docs.konghq.com/hub/#authentication) に関連するプラグインのドキュメントを提供しています。詳細については、[API Gateway Authentication](https://konghq.com/learning-center/api-gateway/api-gateway-authentication) をご覧ください。
