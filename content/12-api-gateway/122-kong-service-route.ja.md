---
title : "Kong Gateway Service"
weight : 122
---

このワークショップでは、HTTPbin API を使用してサービスを作成し、公開します。HTTPbin は、受信したリクエストをレスポンスとしてリクエスト元に返すエコータイプのアプリケーションです。

#### アプリケーションのデプロイ

Kubernetes Deployment と Service の両方で以下の定義を使ってアプリケーションをデプロイします。

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

###### Deployment の確認

* `kong` namespace の service を確認

:::code{showCopyAction=true showLineNumbers=false language=shell}
kubectl get service -n kong
:::

**出力例**

```
NAME                 TYPE           CLUSTER-IP       EXTERNAL-IP                                                              PORT(S)                      AGE
httpbin              ClusterIP      10.100.133.162   <none>                                                                   8000/TCP                     14s
my-kong-kong-proxy   LoadBalancer   10.100.181.39    ac916b2ee885743d6936cd6d5bec19b1-947248632.us-west-1.elb.amazonaws.com   80:32132/TCP,443:31582/TCP   67m
```

* `kong` namespace の Pod を確認

:::code{showCopyAction=true showLineNumbers=false language=shell}
kubectl get pod -n kong
:::

**出力例**

```   
NAME                            READY   STATUS    RESTARTS   AGE
httpbin-74b975fc59-bbb5f        1/1     Running   0          21s
my-kong-kong-5b8fcfcb44-x2z9p   1/1     Running   0          49m
```

#### Kong Gateway Service の作成

Konnect Admin GUI にアクセスし、左のナビゲーションメニューから **Gateway Manager** をクリックし、**default** を選択します。左メニューで、**Gateway Services** をクリックし、**New Gateway Service** をクリックします。

ゲートウェイサービス名 (Gateway Service Name) に「``service1``」と入力します。**Add using Upstream URL** には HTTPbin の Kubernetes Service FQDN (Fully Qualified Domain Name) を入力します。ここでは ``http://httpbin.kong.svc.cluster.local:8000`` を入力し、**Save**をクリックします。

overview のページに新しいサービスが表示されるはずです。

![service1](/static/images/service1.png)

Kong-gratulations!Kong Service を作成したので、このセクションは完了です。次の章に進むには、**Next** をクリックしてください。
