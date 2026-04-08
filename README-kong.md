https://mcshelby.github.io/hugo-theme-relearn/introduction/quickstart/index.html

https://themes.gohugo.io/themes/hugo-theme-relearn/

https://gohugo.io/host-and-deploy/host-on-aws-amplify/




-- Hugo
brew install go
brew install hugo
hugo server -D
http://localhost:1313




-- Podman & Minikube - MacOS
Combination #1
Podman 5.6.1
Minikube 1.36

Combination #2
Podman 5.8.1
Minikube 1.38.1



--- Docker & Minikube - Linux

curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker

docker version



curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube
rm minikube-linux-amd64
minikube version



minikube config view
minikube config unset rootless


minikube stop
minikube delete
minikube start --driver=docker



minikube status
kubectl get nodes





kubectl get namespace kong -o json \
  | jq '.spec.finalizers = []' \
  | kubectl replace --raw "/api/v1/namespaces/kong/finalize" -f -



kubectl get namespaces