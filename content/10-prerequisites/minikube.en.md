---
title : "Minikube"
weight : 104
---

#### Podman
We are going to deploy our Data Plane in a Minikube Cluster over Podman. You can start Podman with:

```
podman machine set --memory 8196
podman machine start
```

If you want to stop it run:
```
podman machine stop
```

```
$ podman --version
podman version 5.5.2
```

#### Minikube

Then you can install Minikube with:
```
minikube start --driver=podman --memory='no-limit'
```

```
$ minikube version
minikube version: v1.36.0
commit: f8f52f5de11fc6ad8244afac475e1d0f96841df1
```


Use should see your cluster running with:
```
kubectl get all --all-namespaces
```

Typical output is:
```
NAMESPACE     NAME                                   READY   STATUS    RESTARTS   AGE
kube-system   pod/coredns-674b8bbfcf-xrllp           0/1     Running   0          12s
kube-system   pod/etcd-minikube                      1/1     Running   0          18s
kube-system   pod/kube-apiserver-minikube            1/1     Running   0          18s
kube-system   pod/kube-controller-manager-minikube   1/1     Running   0          18s
kube-system   pod/kube-proxy-xkfn9                   1/1     Running   0          13s
kube-system   pod/kube-scheduler-minikube            1/1     Running   0          18s
kube-system   pod/storage-provisioner                1/1     Running   0          17s

NAMESPACE     NAME                 TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)                  AGE
default       service/kubernetes   ClusterIP   10.96.0.1    <none>        443/TCP                  19s
kube-system   service/kube-dns     ClusterIP   10.96.0.10   <none>        53/UDP,53/TCP,9153/TCP   18s

NAMESPACE     NAME                        DESIRED   CURRENT   READY   UP-TO-DATE   AVAILABLE   NODE SELECTOR            AGE
kube-system   daemonset.apps/kube-proxy   1         1         1       1            1           kubernetes.io/os=linux   18s

NAMESPACE     NAME                      READY   UP-TO-DATE   AVAILABLE   AGE
kube-system   deployment.apps/coredns   0/1     1            0           18s

NAMESPACE     NAME                                 DESIRED   CURRENT   READY   AGE
kube-system   replicaset.apps/coredns-674b8bbfcf   1         1         0       12s
```


To be able to consume the Kubernetes Load Balancer Services, in another terminal run:
```
minikube tunnel
```


You can now click **Next** to install the operator.