---
title : "Response-Transformer 插件"
weight : 153
---

[Response-Transformer](https://docs.konghq.com/hub/kong-inc/response-transformer/) 插件在将上游响应（如来自服务器的响应）返回给客户端之前会对其进行修改。

在本节中，您将配置 Kong Route 上的 Response-Transformer 插件。具体来说，您将配置 Kong Konnect 在响应客户端之前添加一个新的Header "demo: injected-by-kong"。

#### 创建Response Transformer 插件

进入**route1**配置页面。在**Plugins**选项卡下，点击 **+ New Plugin** 按钮。在**选择插件**页面中，点击**Transformations**部分中的**Response Transformer**插件。

在**Configure plugin: response transformer**页面中，将 **Add.Headers** 设置为 ``demo: injected-by-kong`` 然后保存。


您应该能看到启用了两个插件的 Kong Route：

![response_transformer](/static/images/response_transformer.png)


### 验证
测试以确保 Kong 将请求转换到 echo 服务器和 httpbin 服务器。

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


**预期结果** 注意，"demo: injected-by-kong" 已注入Header中。


#### 清理

删除您为 ``route1`` 启用的 Kong 插件。清理可确保插件不会干扰工作坊中用于演示的任何其他模块，并且每个工作坊模块代码都能继续独立运行。

在实际应用中，您可以根据使用情况启用任意数量的插件。

Kong-gratulations! 现在您可以点击**Next**进入下一个模块。