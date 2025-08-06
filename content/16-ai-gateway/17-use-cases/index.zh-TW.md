---
title : "AI with Amazon Bedrock"
weight : 159
---

#### Kong AI Gateway

隨著多個 AI LLM 供應商的快速崛起，AI 技術領域變得支離破碎，且缺乏標準和控制。Kong AI Gateway 是建構在 Kong Gateway 之上的一套強大功能，旨在幫助開發人員和組織快速、安全地有效採用 AI 功能。

雖然 AI 供應商不符合標準 API 規格，但 Kong AI Gateway 提供標準化的 API 層，允許用戶端從相同的用戶端程式碼庫使用多種 AI 服務。AI Gateway 透過提示工程（prompt engineering）為憑證管理、AI 使用可觀察性、治理和調整提供額外功能。開發人員可使用無程式碼 AI Plugins 來豐富現有的 API 流量，輕鬆增強現有的應用程式功能。

您可以透過一組專門的插件啟用 AI Gateway 功能，使用的模式與您使用任何其他 Kong Gateway 插件相同。

![Kong AI Gateway Architecture](/static/images/ai-gateway.png)

* 功能範圍

![Kong AI Gateway scope](/static/images/ai_gateway_scope.png)

#### Amazon Bedrock

Amazon Bedrock 是一項全面管理的服務，可透過單一 API 提供來自 AI21 Labs、Anthropic、Cohere、Meta、Mistral AI、Stability AI 和 Amazon 等領導 AI 公司的高效能基礎模型 (FM) 選擇，以及您在建立具安全性、隱私性和負責任 AI 的生成式 AI 應用程式所需的廣泛功能。

使用 Amazon Bedrock，您可以輕鬆嘗試和評估適用於您的使用個案的頂尖 FM，使用微調和擷取擴增生成 (RAG) 等技術利用您的資料進行私人自訂，並建立使用您的企業系統和資料來源執行任務的代理。由於 Amazon Bedrock 是無伺服器的，因此您不需要管理任何基礎架構，而且可以使用您已經熟悉的 AWS 服務，安全地將生成 AI 功能整合並部署到您的應用程式中。

本工作坊所描述的使用案例將使用一些基礎模型，包括
* Amazon:
    * Titan Text G1 - Express
* Meta:
    * Llama 3.1 70B Instruct
* Mistal AI:
    * Mistral 7B Instruct

#### 高層次任務
您將完成下列工作：
* 為 Bedrock 整合設定 Kong AI Proxy
* 執行 Kong AI 插件以確保提示訊息的安全性

現在您可以按一下 **Next**，繼續進行下一步。
