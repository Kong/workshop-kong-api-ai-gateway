---
title : "Kong 网关服务"
weight : 122
---

在本工作坊中，您將為 HTTPbin API 建立並揭露一個服務。HTTPbin 是一種回聲類型的應用程式，會將請求作為回應回傳給請求者。

#### 部署應用程式

使用 Kubernetes 部署和服務的下列聲明部署應用程式。

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

###### 檢查部署

* 在 `kong` 命名空間中觀察 Kubernetes 服務

:::code{showCopyAction=true showLineNumbers=false language=shell}
kubectl get service -n kong
:::

**樣本輸出**

```
NAME                 TYPE           CLUSTER-IP       EXTERNAL-IP                                                              PORT(S)                      AGE
httpbin              ClusterIP      10.100.133.162   <none>                                                                   8000/TCP                     14s
my-kong-kong-proxy   LoadBalancer   10.100.181.39    ac916b2ee885743d6936cd6d5bec19b1-947248632.us-west-1.elb.amazonaws.com   80:32132/TCP,443:31582/TCP   67m
```

* 在 `kong` 命名空間中觀察 Pods

:::code{showCopyAction=true showLineNumbers=false language=shell}
kubectl get pod -n kong
:::

**樣本輸出**

```   
NAME                            READY   STATUS    RESTARTS   AGE
httpbin-74b975fc59-bbb5f        1/1     Running   0          21s
my-kong-kong-5b8fcfcb44-x2z9p   1/1     Running   0          49m
```

#### 建立Kong Gateway 服務

進入 Konnect Admin GUI，在左邊的導覽功能表中，點選 **Gateway Manager** 並選擇 **default** 控制平面。在左側功能表中，點選 **Gateway Service**。點選 **+ New Gateway Service**。

在**Gateway Service Name**中，鍵入`service1`。對於 **Add using Upstream URL**，鍵入添加 HTTPbin 的 Kubernetes 服務 FQDN（Fully Qualified Domain Name）的 URL，在我們的例子中為 ``http://httpbin.kong.svc.cluster.local:8000``。點擊 **Save**。

您應該會看到新服務的總覽頁面。

![service1](/static/images/service1.png)


Kong-恭喜！您現在已經建立了一個 Kong 服務，達到本單元的結尾。現在您可以按下**下一步**，繼續下一章的內容。


