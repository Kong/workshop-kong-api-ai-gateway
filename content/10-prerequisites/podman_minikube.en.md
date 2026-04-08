---
title : "Podman and Minikube"
weight : 104
---

We are going to deploy our Data Plane in a Minikube Cluster over Podman. This workshop has been created and tested using the following versions. Make sure you have them installed.
* Podmang 5.8.1
* Minikube 1.38.1



### Podman 5.8.1

Here are the [instructions](https://podman.io/docs/installation) to install Podman and the installation package for [5.8.1 version](https://github.com/containers/podman/releases/tag/v5.8.1).


Initialize a machine:

```
podman machine init
```

You can start Podman with:
```
podman machine set --memory 8196 --rootful
podman machine start
```


Check the version:

```
$ podman --version
podman version 5.8.1
```

### Minikube 1.38.1

You can install it with:

```
curl -LO https://github.com/kubernetes/minikube/releases/download/v1.38.1/minikube-darwin-arm64
sudo install minikube-darwin-arm64 /usr/local/bin/minikube
```

```
$ minikube version
minikube version: v1.38.1
commit: c93a4cb9311efc66b90d33ea03f75f2c4120e9b0
```




##### Start your cluster


```
minikube start --driver=podman --memory='no-limit' --container-runtime=containerd
```




##### Check your cluster

Use should see your cluster running with:

```
kubectl get all --all-namespaces
```

Typical output is:
```
NAMESPACE     NAME                                   READY   STATUS    RESTARTS   AGE
kube-system   pod/coredns-7d764666f9-znvfn           1/1     Running   0          78s
kube-system   pod/etcd-minikube                      1/1     Running   0          84s
kube-system   pod/kindnet-cwmh6                      1/1     Running   0          78s
kube-system   pod/kube-apiserver-minikube            1/1     Running   0          84s
kube-system   pod/kube-controller-manager-minikube   1/1     Running   0          84s
kube-system   pod/kube-proxy-fzt4f                   1/1     Running   0          78s
kube-system   pod/kube-scheduler-minikube            1/1     Running   0          84s
kube-system   pod/storage-provisioner                1/1     Running   0          83s

NAMESPACE     NAME                 TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)                  AGE
default       service/kubernetes   ClusterIP   10.96.0.1    <none>        443/TCP                  85s
kube-system   service/kube-dns     ClusterIP   10.96.0.10   <none>        53/UDP,53/TCP,9153/TCP   84s

NAMESPACE     NAME                        DESIRED   CURRENT   READY   UP-TO-DATE   AVAILABLE   NODE SELECTOR            AGE
kube-system   daemonset.apps/kindnet      1         1         1       1            1           <none>                   83s
kube-system   daemonset.apps/kube-proxy   1         1         1       1            1           kubernetes.io/os=linux   84s

NAMESPACE     NAME                      READY   UP-TO-DATE   AVAILABLE   AGE
kube-system   deployment.apps/coredns   1/1     1            1           84s

NAMESPACE     NAME                                 DESIRED   CURRENT   READY   AGE
kube-system   replicaset.apps/coredns-7d764666f9   1         1         1       79s
```


To be able to consume the Kubernetes Load Balancer Services, in another terminal run:
```
minikube tunnel
```





If you want to stop Minikube run:
```
minikube stop
```


If you want to stop Podman run:
```
podman machine stop
```




You can now click **Next** to install the operator.