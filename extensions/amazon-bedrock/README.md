# Natesclaw Amazon Bedrock Provider

Official Natesclaw provider plugin for Amazon Bedrock. It adds Bedrock model discovery, text generation, embeddings, and guardrail-aware provider routing for agents that use AWS-hosted models.

Install from Natesclaw:

```bash
natesclaw plugins install @natesclaw/amazon-bedrock-provider
```

Configure AWS credentials and region through your normal Natesclaw credential/profile setup, then select Bedrock models with the `amazon-bedrock/...` provider prefix.
