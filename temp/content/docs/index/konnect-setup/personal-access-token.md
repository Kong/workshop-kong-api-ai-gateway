---
title: Personal Access Token
weight: 1
---

### PAT (Personal Access Token)

KGO requires a [Konnect Personal Access Token (PAT)](https://docs.konghq.com/konnect/org-management/access-tokens/) for creating the Control Plane. To generate your PAT, click on your initials in the upper right corner of the Konnect home page, then select `Personal Access Tokens`. Click on `+ Generate Token`, name your PAT, set its expiration time, and be sure to copy and save it, as Konnect won’t display it again.

![pat](/images/pat.png)

::alert[Be sure to copy and save PAT, as Konnect won’t display it again.]

#### Konnect PAT secret

Create a Kubernetes (K8) Secret with your PAT in the `kong` namespace. KGO requires the secret to be labeled. 

* Save PAT in your CloudShell environment variables

{{< code-toggle copy=true >}}

```{copy=true}
echo "export PAT=PASTE_THE_CONTENTS_OF_COPIED_PAT" >> ~/.bashrc
bash
```
{{< /code-toggle >}}


:::code{showCopyAction=true showLineNumbers=false language=shell}
echo "export PAT=PASTE_THE_CONTENTS_OF_COPIED_PAT" >> ~/.bashrc
bash
:::

::alert[Pls don’t forget to replace `PASTE_THE_CONTENTS_OF_COPIED_PAT` in the below command with the copied PAT from Kong UI. ]


* Create the namespace and Kubernetes Service Account



The Kubernetes Service Account will be used to deploy the Kong Data Plane.
:::code{showCopyAction=true showLineNumbers=false language=shell}
kubectl create namespace kong
kubectl create sa kaigateway-podid-sa -n kong
:::

::alert[Pls **DO NOT** modify the service account name. Pod Identities and the respective IAM permissions are specfically associated with this name. ]


* Create K8 Secret with PAT

::alert[Pls don’t forget to replace `PASTE_THE_CONTENTS_OF_COPIED_PAT` in the below command with the copied PAT from Kong UI. ]


:::code{showCopyAction=true showLineNumbers=false language=shell}
kubectl create secret generic konnect-pat -n kong --from-literal=token=$(echo $PAT)
kubectl label secret konnect-pat -n kong "konghq.com/credential=konnect"
:::


You can now click Next to install the operator.