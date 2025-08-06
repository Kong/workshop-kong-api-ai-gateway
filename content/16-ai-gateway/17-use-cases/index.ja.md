---
title : "AI with Amazon Bedrock"
weight : 159
---

#### KongAIゲートウェイ

複数のAI LLMプロバイダーが急速に台頭する中、AIテクノロジーの展望は断片化され、標準と統制に欠けています。Kong AI Gatewayは、Kong Gatewayの上に構築された強力な機能セットで、開発者や組織がAI機能を迅速かつ安全に効果的に導入できるように設計されています。

AIプロバイダーは標準的なAPI仕様に準拠していないが、Kong AI Gatewayは正規化されたAPIレイヤーを提供し、クライアントが同じクライアントコードベースから複数のAIサービスを利用できるようにする。AI Gatewayは、クレデンシャル管理、AI利用状況の観測可能性、ガバナンス、およびプロンプト・エンジニアリングによるチューニングのための追加機能を提供する。開発者は、コード不要のAIプラグインを使用して既存のAPIトラフィックを強化し、既存のアプリケーション機能を簡単に強化することができます。

他のKong Gatewayプラグインと同じモデルを使用して、専用のプラグインを使用してAIゲートウェイの機能を有効にすることができます。

![Kong AI Gateway Architecture](/static/images/ai-gateway.png)

* Kong AI Gatewayの機能範囲

![Kong AI Gateway scope](/static/images/ai_gateway_scope.png)

#### Amazon Bedrock

Amazon Bedrockは、AI21 Labs、Anthropic、Cohere、Meta、Mistral AI、Stability AI、Amazonなどの主要なAI企業が提供する高性能な基盤モデル（FM）の選択肢を単一のAPIを通じて提供するフルマネージドサービスであり、セキュリティ、プライバシー、責任あるAIを備えたジェネレーティブAIアプリケーションの構築に必要な幅広い機能を備えています。

Amazon Bedrockを使用すると、ユースケースに最適なFMを簡単に試して評価し、微調整やRAG（Retrieval Augmented Generation）などのテクニックを使用して、データを使用してFMを個人的にカスタマイズし、企業システムやデータソースを使用してタスクを実行するエージェントを構築することができます。Amazon Bedrockはサーバーレスであるため、インフラを管理する必要がなく、すでに使い慣れたAWSサービスを使用して、生成AI機能をアプリケーションに安全に統合して展開することができます。

このワークショップで説明するユースケースは、以下のようなFoundation Modelを使用します：
* Amazon:
    * Titan Text G1 - Express
* Meta:
    * Llama 3.1 70B Instruct
* Mistal AI:
    * Mistral 7B Instruct

#### ハイレベルタスク
以下を完了します：
* Bedrock統合のためのKong AIプロキシのセットアップ
* プロンプトメッセージを保護するためのKong AIプラグインの実装

次に進むには、**Next**をクリックしてください。