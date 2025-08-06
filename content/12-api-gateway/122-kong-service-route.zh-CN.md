---
title : "Kong 网关服务"
weight : 122
---

在本讲座中，您将创建并向 HTTPbin API 公开一项服务。HTTPbin 是一个回声类型的应用程序，会将请求作为响应返回给请求者。

#### 部署应用程序

使用 Kubernetes 部署和服务的以下声明部署应用程序。

:::code{showCopyAction=true showLineNumbers=false language=shell}
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Service
metadata:
  name: httpbin
  namespace: kong
  labels:
    app: httpbin
spec:
  type: ClusterIP
  ports:
  - name: http
    port: 8000
    targetPort: 80
  selector:
    app: httpbin
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: httpbin
  namespace: kong
spec:
  replicas: 1
  selector:
    matchLabels:
      app: httpbin
      version: v1
  template:
    metadata:
      labels:
        app: httpbin
        version: v1
    spec:
      containers:
      - image: docker.io/kong/httpbin
        imagePullPolicy: IfNotPresent
        name: httpbin
        ports:
        - containerPort: 8000
EOF
:::

###### 检查部署

* 在 `kong` 命名空间中观察 Kubernetes 服务

:::code{showCopyAction=true showLineNumbers=false language=shell}
kubectl get service -n kong
:::

**输出样本**

```
NAME                 TYPE           CLUSTER-IP       EXTERNAL-IP                                                              PORT(S)                      AGE
httpbin              ClusterIP      10.100.133.162   <none>                                                                   8000/TCP                     14s
my-kong-kong-proxy   LoadBalancer   10.100.181.39    ac916b2ee885743d6936cd6d5bec19b1-947248632.us-west-1.elb.amazonaws.com   80:32132/TCP,443:31582/TCP   67m
```

* 观察 `kong` 命名空间中的 Pods

:::code{showCopyAction=true showLineNumbers=false language=shell}
kubectl get pod -n kong
:::

**输出样本**

```   
NAME                            READY   STATUS    RESTARTS   AGE
httpbin-74b975fc59-bbb5f        1/1     Running   0          21s
my-kong-kong-5b8fcfcb44-x2z9p   1/1     Running   0          49m
```

#### 创建Kong Gateway服务

进入 Konnect Admin GUI，在左侧导航菜单中点击**Gateway Manager** ，选择 **default** 控制平面。在左侧菜单中，点击**Gateway Service**。点击 **+ New Gateway Service**。

在**Gateway Service Name**中，键入`service1`。对于 **Add using Upstream URL**，键入添加 HTTPbin 的 Kubernetes 服务 FQDN（Fully Qualified Domain Name）的 URL，在我们的例子中为 ``http://httpbin.kong.svc.cluster.local:8000``。点击 **Save**。

您将看到新服务的概览页面。

![service1](/static/images/service1.png)


Kong-恭喜！创建了一个 Kong 服务，本模块到此结束。现在您可以点击**下一步**，继续下一章的内容。


