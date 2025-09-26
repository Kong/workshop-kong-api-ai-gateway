---
title : "Minikube"
weight : 104
---

#### Podman
We are going to deploy our Data Plane in a Minikube Cluster over Podman.

Run it if you don't have any machine installed:

```
podman machine init
```

You can start Podman with:
```
podman machine set --memory 8196 --rootful
podman machine start
```

If you want to stop it run:
```
podman machine stop
```

```
$ podman --version
podman version 5.6.1
```

#### Minikube 1.36

You can install Minikube with:

```
curl -LO https://github.com/kubernetes/minikube/releases/download/v1.36.0/minikube-darwin-arm64
sudo install minikube-darwin-arm64 /usr/local/bin/minikube
```

```
$ minikube version
minikube version: v1.36.0
commit: f8f52f5de11fc6ad8244afac475e1d0f96841df1-dirty
```





#### Minikube 1.37

You can install Minikube with:

```
curl -LO https://github.com/kubernetes/minikube/releases/latest/download/minikube-darwin-arm64
sudo install minikube-darwin-arm64 /usr/local/bin/minikube
```

```
$ minikube version
minikube version: v1.37.0
commit: 65318f4cfff9c12cc87ec9eb8f4cdd57b25047f3
```



##### Check your cluster


```
minikube start --driver=podman --memory='no-limit' --container-runtime=containerd
```

Use should see your cluster running with:

```
kubectl get all --all-namespaces
```

Typical output is:
```
NAMESPACE     NAME                                   READY   STATUS    RESTARTS        AGE
kube-system   pod/coredns-674b8bbfcf-7hnl7           1/1     Running   1 (5m12s ago)   6m1s
kube-system   pod/etcd-minikube                      1/1     Running   1 (5m12s ago)   6m6s
kube-system   pod/kindnet-vbhk5                      1/1     Running   1 (5m12s ago)   6m1s
kube-system   pod/kube-apiserver-minikube            1/1     Running   1 (5m12s ago)   6m6s
kube-system   pod/kube-controller-manager-minikube   1/1     Running   1 (5m12s ago)   6m6s
kube-system   pod/kube-proxy-4qcvd                   1/1     Running   1 (5m12s ago)   6m1s
kube-system   pod/kube-scheduler-minikube            1/1     Running   1 (5m12s ago)   6m6s
kube-system   pod/storage-provisioner                1/1     Running   3 (4m39s ago)   6m5s

NAMESPACE     NAME                 TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)                  AGE
default       service/kubernetes   ClusterIP   10.96.0.1    <none>        443/TCP                  6m7s
kube-system   service/kube-dns     ClusterIP   10.96.0.10   <none>        53/UDP,53/TCP,9153/TCP   6m6s

NAMESPACE     NAME                        DESIRED   CURRENT   READY   UP-TO-DATE   AVAILABLE   NODE SELECTOR            AGE
kube-system   daemonset.apps/kindnet      1         1         1       1            1           <none>                   6m5s
kube-system   daemonset.apps/kube-proxy   1         1         1       1            1           kubernetes.io/os=linux   6m6s

NAMESPACE     NAME                      READY   UP-TO-DATE   AVAILABLE   AGE
kube-system   deployment.apps/coredns   1/1     1            1           6m6s

NAMESPACE     NAME                                 DESIRED   CURRENT   READY   AGE
kube-system   replicaset.apps/coredns-674b8bbfcf   1         1         1       6m1s
```


To be able to consume the Kubernetes Load Balancer Services, in another terminal run:
```
minikube tunnel
```


You can now click **Next** to install the operator.