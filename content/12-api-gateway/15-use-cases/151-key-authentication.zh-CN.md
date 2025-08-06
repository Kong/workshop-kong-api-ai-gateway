---
title : "API 密钥认证"
weight : 151
---

一个 Kong Consumer代表一个服务的consumer（用户或应用程序）。Kong Consumer 与Kong Gateway提供的验证机制紧密相连。

要开始使用 API Authentication 和 Kong Consumer，我们先来实现一个基本的密钥认证机制。API 密钥是 Konnect 提供的基本安全机制之一。为了使用 API，consumer应在请求头中注入一个事先创建的 API 密钥。如果网关能识别 API 密钥，就可以使用 API。


#### 在 Kong Route 上启用密钥验证插件

为了使操作更简单、更具体，让我们在路由上启用密钥验证插件。

使用**Gateway Manager**菜单选项，转到我们的``route1``路由。在 **Plugins** 选项卡下，点击 **+ New Plugin** 按钮，然后点击 **Authentication** 部分中的 **View more** 链接。

点击**Key Authentication**插件。请记住，**Key Names**配置设置为 ``apikey``。接受所有默认值，然后点击**Save**。

您将看到启用了两个插件的路由：现有的**Rate Limiting**和新的**Key Authentication**：

![key_authentication](/static/images/key_authentication.png)


#### 访问 Route

现在，如果您尝试访问路由，就会得到一个特定的 **401** 错误代码，意思是由于您的请求中没有注入任何 API 密钥，因此不允许您使用它。

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


#### 创建一个 Kong Consumer

进入**Gateway Manager**，选择 ``default``运行时组。单击**Consumers**子菜单选项，然后单击 **+Consumers**按钮。

在**Username**中键入**consumer1**。这不是一个凭证，而只是 Kong Gateway 管理员引用指定 Kong consumer的一种方式。

![consumer](/static/images/consumer.png)

保存它。然后应该会重定向到**Consumers**页面。单击您刚刚创建的``consumer1``，然后在**Credentials**选项卡中。在选项卡中，选择**Key Authentication**，然后单击 **+ New Key Auth Credential** 按钮。

在**Create Key Auth Credential**页面中，您可以输入任何密钥。如果您将 **Key** 字段留空，Konnect 将生成一个随机密钥。为您的密钥输入 ``123456``。保存它。

再次单击**Key Authentication**选项。您应该会看到带有第一个凭证的consumer。

![consumer_key](/static/images/consumer_key.png)


#### 使用 API 密钥访问 Route

现在，您需要将刚刚创建的密钥作为头注入到您的请求中。使用 HTTPie，您可以轻松地这样做：

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

当然，如果您注入错误的密钥，您会得到一个特定的错误，如下所示：

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

* Header必须包含 API 密钥名称，在我们的例子中是 ``apikey``。这是您在启用**Key Authentication**时，Konnect 提供的默认名称。您可以更改插件配置，如果需要的话。
* 请注意，其他策略，由现有的**Proxy Cache**和**Rate Limiting**插件实施，正如预期的那样，仍然被强制执行。


### Kong Consumer Policies

在 API 密钥策略到位后，我们可以控制传入的请求。然而，其他插件实施的策略与consumer无关。

因此，能够为每个consumer定义特定的策略非常重要。例如，为不同的consumer定义速率限制策略会很有用：

* consumer1:
    * apikey = 123456
    * rate limiting policy = 5 rpm
* consumer2:
    * apikey = 987654
    * rate limiting policy = 8 rpm

这样做，Data Plane 不仅可以保护路由，还可以根据注入的密钥识别consumer，并根据consumer实施特定的策略。

对于本节，我们实施了一个速率限制策略。请记住，consumer可能还启用了其他插件，如 [Request Transformer](https://docs.konghq.com/hub/kong-inc/request-transformer/)、[TCP Log](https://docs.konghq.com/hub/kong-inc/tcp-log/) 等。


#### 新Consumer

为了使策略到位，让我们删除现有的速率限制插件。最简单的方法是进入``default`` **Runtime Group** 并删除**Rate Limiting**插件。

然后，创建第二个``consumer2``，就像您对``consumer1``所做的那样，使用``987654``密钥。

如果您愿意，您可以向您的请求注入这两个密钥。

:::code{showCopyAction=true showLineNumbers=false language=shell}
curl --head $DATA_PLANE_LB/route1/get -H 'apikey:123456'
:::

or

:::code{showCopyAction=true showLineNumbers=false language=shell}
curl --head $DATA_PLANE_LB/route1/get -H 'apikey:987654'
:::


#### Consumer1 的策略

现在，让我们为每个Consumer创建速率限制策略。进入**Consumer**菜单选项，选择``consumer1``。单击**Plugins**，然后单击 **+ New Plugin**。

在**Traffic control**部分选择**Rate Limiting**：

![rate_limiting2](/static/images/rate_limiting2.png)

请注意，Konnect 仅显示适用于此上下文的插件。将**Minute**设置为5以实施我们的策略。保存它，然后单击**Plugins**选项卡。您应该会看到``consumer1``的插件。

![consumer_plugin](/static/images/consumer_plugin.png)


#### Consumer2 的策略

创建一个新的插件，这次是为``consumer2``，将**Minute**设置为``8``。


#### 使用不同 API 密钥的路由consumer。

首先，让我们使用``consumer1`` 的 API 密钥消费路由：

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

现在，让我们使用 ``consumer2`` 的 API Key 来消费它。可以看到，Data Plane 正在独立处理速率限制进程。

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

如果我们继续使用第一个 API 密钥发送请求，最终，正如预期的那样，我们会得到一个错误代码：

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

不过，第二个 API 密钥仍可使用 Kong Route：

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

恭喜！通过使用密钥验证 API 请求并将不同Consumer与策略计划关联起来，本模块现已结束。现在您可以点击**Next**，继续下一个模块。

#### 可选阅读

在服务、路由或全局应用 Kong 插件有助于我们在 API Gateway 层实施一系列策略。但是，到目前为止，我们还没有控制向 Data Plane 发送请求的对象。也就是说，任何拥有运行时实例 ELB 地址的人都可以向它发送请求并使用服务。

API 网关验证是控制允许使用 API 传输数据的重要方法。基本上，它使用一组预定义的凭据来检查特定consumer是否有访问 API 的权限。

Kong Gateway 有一个插件库，可提供简单的方法来实现最著名和最广泛使用的 API 网关身份验证方法。下面是一些常用的方法：

* 基本认证
* 密钥验证
* OAuth 2.0 身份验证
* LDAP 身份验证
* OpenID 连接

Kong Plugin Hub 提供有关所有基于 [验证](https://docs.konghq.com/hub/#authentication_) 的插件的文档。请参阅以下链接，了解有关 [API Gateway Authentication](https://konghq.com/learning-center/api-gateway/api-gateway-authentication) 的更多信息