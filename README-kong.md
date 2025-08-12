https://mcshelby.github.io/hugo-theme-relearn/introduction/quickstart/index.html

https://themes.gohugo.io/themes/hugo-theme-relearn/

https://gohugo.io/host-and-deploy/host-on-aws-amplify/






kubectl get namespace kong -o json \
  | jq '.spec.finalizers = []' \
  | kubectl replace --raw "/api/v1/namespaces/kong/finalize" -f -



kubectl get namespaces