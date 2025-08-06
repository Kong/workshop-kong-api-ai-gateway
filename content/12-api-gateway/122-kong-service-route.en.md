---
title : "Kong Gateway Service and Kong Route"
weight : 122
---

For the purpose of this workshop, you’ll create and expose a service to the HTTPbin API. HTTPbin is an echo-type application that returns requests back to the requester as responses.

#### Deploy the Application

Deploy the application using the following declaration with both Kubernetes Deployment and Service.

{{<highlight>}}
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
{{</highlight>}}


<!-- If you want to delete it, run:
:::code{showCopyAction=true showLineNumbers=false language=shell}
kubectl delete service httpbin
kubectl delete deployment httpbin
::: -->



###### Check the Deployment

* Observe Kubernetes Services in `kong` namespace

{{<highlight>}}
kubectl get service httpbin -n kong
{{</highlight>}}

**Sample Output**
```
NAME      TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
httpbin   ClusterIP   10.100.89.150   <none>        8000/TCP   20h
```

* Observe Pods in `kong` namespace

{{<highlight>}}
kubectl get pod -n kong
{{</highlight>}}

**Sample Output**
```   
NAME                                         READY   STATUS    RESTARTS   AGE
dataplane-dataplane1-rbwck-98fcbc654-rt75p   1/1     Running   0          76m
httpbin-5c69574c95-xq76q                     1/1     Running   0          20h
```


#### Ping Konnect with decK

Before start using decK, you should ping Konnect to check if the connecting is up. Note we assume you have the PAT environment variable set. Please, refer to the previous section to learn how to issue a PAT.

{{<highlight>}}
deck gateway ping --konnect-control-plane-name kong-workshop --konnect-token $PAT
{{</highlight>}}


**Expected Output**
```
Successfully Konnected to the Example-Name organization!
```


#### Create a Kong Gateway Service and Kong Route

Create the following declaration first. Remarks:
* Note the ``host`` and ``port`` refers to the HTTPbin's Kubernetes Service FQDN (Fully Qualified Domain Name), in our case ``http://httpbin.kong.svc.cluster.local:8000``.
* The declaration tags the objects so you can managing them apart from other ones.

{{<highlight>}}
cat > httpbin.yaml << 'EOF'
_format_version: "3.0"
_konnect:
  control_plane_name: kong-workshop
_info:
  select_tags:
  - httpbin-service-route
services:
- name: httpbin-service
  host: httpbin.kong.svc.cluster.local
  port: 8000
  routes:
  - name: httpbin-route
    paths:
    - /httpbin-route
EOF
{{</highlight>}}


#### Submit the declaration

Now, you can use the following command to sync your Konnect Control Plane with the declaration. Note that all other existing objects will be deleted.

{{<highlight>}}
deck gateway sync --konnect-token $PAT httpbin.yaml
{{</highlight>}}

**Expected Output**
```
creating service httpbin-service
creating route httpbin-route
Summary:
  Created: 2
  Updated: 0
  Deleted: 0
```

You should see your new service’s overview page.

![service1](/static/images/httpbin-service-route.png)

<!-- If you want to delete them run:

:::code{showCopyAction=true showLineNumbers=false language=shell}
deck gateway reset --konnect-control-plane-name kong-aws --konnect-token $PAT -f
::: -->


#### Consume the Route

We are to use the same ELB provisioned during the Data Plane deployment:

{{<highlight>}}
curl -v $DATA_PLANE_LB/httpbin-route/get
{{</highlight>}}

If successful, you should see the **httpbin** output:

```
*   Trying 127.0.0.1:80...
* Connected to 127.0.0.1 (127.0.0.1) port 80
> GET /httpbin-route/get HTTP/1.1
> Host: 127.0.0.1
> User-Agent: curl/8.7.1
> Accept: */*
> 
* Request completely sent off
< HTTP/1.1 200 OK
< Content-Type: application/json
< Content-Length: 377
< Connection: keep-alive
< Server: gunicorn
< Date: Wed, 06 Aug 2025 16:19:15 GMT
< Access-Control-Allow-Origin: *
< Access-Control-Allow-Credentials: true
< X-Kong-Upstream-Latency: 6
< X-Kong-Proxy-Latency: 3
< Via: 1.1 kong/3.11.0.2-enterprise-edition
< X-Kong-Request-Id: 0cbe555eefb4f14bb43f9b511435bd5c
< 
{"args":{},"headers":{"Accept":"*/*","Connection":"keep-alive","Host":"httpbin.kong.svc.cluster.local:8000","User-Agent":"curl/8.7.1","X-Forwarded-Host":"127.0.0.1","X-Forwarded-Path":"/httpbin-route/get","X-Forwarded-Prefix":"/httpbin-route","X-Kong-Request-Id":"0cbe555eefb4f14bb43f9b511435bd5c"},"origin":"10.244.0.1","url":"http://httpbin.kong.svc.cluster.local:8000/get"}
* Connection #0 to host 127.0.0.1 left intact
```


Kong-gratulations! have now reached the end of this module by having your first service set up, running, and routing traffic proxied through a Kong data plane. You can now click **Next** to proceed with the next module.


Kong-gratulations! have now reached the end of this module by creating a Kong Service. You can now click **Next** to proceed with the next chapter.


