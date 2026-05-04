---
name: langflow-components
description: "Reference catalog of all 296+ built-in Langflow 1.8.4 components — what each does, its output type, and required/key parameters. Use when choosing which component to add to a flow, wiring edges, or looking up parameter names. Composio (63 API connectors) listed separately at the end."
argument-hint: "Name of component or category you want to look up (e.g. 'Cloudflare embeddings', 'vector stores', 'audio transcription')"
---

# Langflow 1.8.4 — Component Catalog

> Generated from `/api/v1/all`. **296 built-in components** across 19 categories.  
> Composio provides 63 additional API-connector tools (Google Calendar, Sheets, Docs, Meet, BigQuery, Tasks, Classroom) — not listed here but available in the `[composio]` category.  
> **Req ✓** = field is required. All other visible non-advanced fields are listed.


## Component Index

| Category | Count |
|---|---|
| Embeddings | 2 |
| Vectorstores | 1 |
| Tools | 12 |
| Prototypes | 1 |
| Axa | 1 |
| Hitl | 1 |
| Scorers | 1 |
| Testing | 1 |
| Faiss | 1 |
| Notion | 8 |
| Agentics | 3 |
| Agentql | 1 |
| Aiml | 2 |
| Altk | 1 |
| Amazon | 4 |
| Anthropic | 1 |
| Apify | 1 |
| Arxiv | 1 |
| Assemblyai | 5 |
| Azure | 2 |
| Baidu | 1 |
| Bing | 1 |
| Cassandra | 3 |
| Chroma | 1 |
| Cleanlab | 3 |
| Clickhouse | 1 |
| Cloudflare | 1 |
| Cohere | 3 |
| Cometapi | 1 |
| Confluence | 1 |
| Couchbase | 1 |
| Crewai | 6 |
| Cuga | 1 |
| Custom Component | 1 |
| Data Source | 9 |
| Datastax | 16 |
| Deepseek | 1 |
| Docling | 4 |
| Duckduckgo | 1 |
| Elastic | 3 |
| Exa | 1 |
| Files And Knowledge | 4 |
| Firecrawl | 4 |
| Flow Controls | 9 |
| Git | 2 |
| Glean | 1 |
| Google | 9 |
| Groq | 1 |
| Homeassistant | 2 |
| Huggingface | 2 |
| Ibm | 2 |
| Icosacomputing | 1 |
| Input Output | 5 |
| Jigsawstack | 11 |
| Langchain Utilities | 26 |
| Langwatch | 1 |
| Litellm | 1 |
| Llm Operations | 6 |
| Lmstudio | 2 |
| Maritalk | 1 |
| Mem0 | 1 |
| Milvus | 1 |
| Mistral | 2 |
| Models And Agents | 6 |
| Mongodb | 1 |
| Needle | 1 |
| Notdiamond | 1 |
| Novita | 1 |
| Nvidia | 5 |
| Olivya | 1 |
| Ollama | 2 |
| Openai | 2 |
| Openrouter | 1 |
| Perplexity | 1 |
| Pgvector | 1 |
| Pinecone | 1 |
| Processing | 26 |
| Qdrant | 1 |
| Redis | 2 |
| Sambanova | 1 |
| Scrapegraph | 3 |
| Searchapi | 1 |
| Serpapi | 1 |
| Supabase | 1 |
| Tavily | 2 |
| Twelvelabs | 7 |
| Unstructured | 1 |
| Upstash | 1 |
| Utilities | 4 |
| Vectara | 2 |
| Vertexai | 2 |
| Vllm | 2 |
| Vlmrun | 1 |
| Weaviate | 1 |
| Wikipedia | 2 |
| Wolframalpha | 1 |
| Xai | 1 |
| Yahoosearch | 1 |
| Youtube | 7 |
| Zep | 1 |

## Embeddings

### Embedding Similarity `[EmbeddingSimilarityComponent]`
Compute selected form of similarity between two embedding vectors.
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| Embedding Vectors | ✓ | other |  |
| Similarity Metric |  | str | Cosine Similarity |

### Text Embedder `[TextEmbedderComponent]`
Generate embeddings for a given message using the specified embedding model.
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| Embedding Model | ✓ | other |  |
| Message | ✓ | str |  |

## Vectorstores

### Local DB `[LocalDB]`
Local Vector Store with search capabilities
**Output:** DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| Allow Duplicates |  | bool | False |
| Collection Name | ✓ | str | langflow |
| Embedding | ✓ | other |  |
| Existing Collections |  | str |  |
| Ingest Data |  | other |  |
| Limit |  | int | 0 |
| Mode |  | tab | Ingest |
| Number of Results |  | int | 10 |
| Persist Directory |  | str |  |
| Search Query |  | str |  |
| Search Type |  | str | Similarity |

## Tools

### Calculator `[CalculatorTool]`
Perform basic arithmetic operations on a given expression.
**Output:** Data, Tool

| Parameter | Req | Type | Default |
|---|---|---|---|
| Expression |  | str |  |

### Google Search API [DEPRECATED] `[GoogleSearchAPI]`
Call Google Search API.
**Output:** Data, Tool

| Parameter | Req | Type | Default |
|---|---|---|---|
| Google API Key | ✓ | str |  |
| Google CSE ID | ✓ | str |  |
| Input |  | str |  |
| Number of results | ✓ | int | 4 |

### Google Serper API [DEPRECATED] `[GoogleSerperAPI]`
Call the Serper.dev Google Search API.
**Output:** Data, Tool

| Parameter | Req | Type | Default |
|---|---|---|---|
| Number of results | ✓ | int | 4 |
| Query |  | str |  |
| Query Params |  | dict | {'gl': 'us', 'hl': 'en'} |
| Query Type |  | str | search |
| Serper API Key | ✓ | str |  |

### Python Code Structured `[PythonCodeStructuredTool]`
structuredtool dataclass code to tool
**Output:** Tool

| Parameter | Req | Type | Default |
|---|---|---|---|
| Classes |  | str |  |
| Functions |  | str |  |
| Global Variables |  | dict |  |
| Return Directly |  | bool | False |
| Tool Code | ✓ | str |  |
| Description | ✓ | str |  |
| Tool Function | ✓ | str |  |
| Tool Name | ✓ | str |  |

### Python REPL `[PythonREPLTool]`
A tool for running Python code in a REPL environment.
**Output:** Data, Tool

| Parameter | Req | Type | Default |
|---|---|---|---|
| Tool Description |  | str | A Python shell. Use this to execute pyth |
| Global Imports |  | str | math |
| Tool Name |  | str | python_repl |

### SearXNG Search `[SearXNGTool]`
A component that searches for tools using SearXNG.
**Output:** Tool

| Parameter | Req | Type | Default |
|---|---|---|---|
| Categories |  | str |  |
| Language |  | str |  |
| Max Results | ✓ | int | 10 |
| URL | ✓ | str | http://localhost |

### Search API `[SearchAPI]`
Call the searchapi.io API with result limiting
**Output:** Data, Tool

| Parameter | Req | Type | Default |
|---|---|---|---|
| SearchAPI API Key | ✓ | str |  |
| Engine |  | str | google |
| Input |  | str |  |
| Max Results |  | int | 5 |
| Max Snippet Length |  | int | 100 |
| Search parameters |  | dict | {} |

### Serp Search API `[SerpAPI]`
Call Serp Search API with result limiting
**Output:** Data, Tool

| Parameter | Req | Type | Default |
|---|---|---|---|
| Input |  | str |  |
| Max Results |  | int | 5 |
| Max Snippet Length |  | int | 100 |
| Parameters |  | dict | {} |
| SerpAPI API Key | ✓ | str |  |

### Tavily Search API `[TavilyAISearch]`
**Tavily Search API** is a search engine optimized for LLMs and RAG,         aimed at efficient,
quick, and persistent search results. It can be used independently or as an agent tool.  Note: Check
'Advanced' for all options.
**Output:** Data, Tool

| Parameter | Req | Type | Default |
|---|---|---|---|
| Tavily API Key | ✓ | str |  |
| Chunks Per Source |  | int | 3 |
| Days |  | int | 7 |
| Exclude Domains |  | str |  |
| Include Answer |  | bool | True |
| Include Domains |  | str |  |
| Include Images |  | bool | True |
| Include Raw Content |  | bool | False |
| Max Results |  | int | 5 |
| Search Query |  | str |  |
| Search Depth |  | str | advanced |
| Time Range |  | str |  |
| Search Topic |  | str | general |

### Wikidata API `[WikidataAPI]`
Performs a search using the Wikidata API.
**Output:** Data, Tool

| Parameter | Req | Type | Default |
|---|---|---|---|
| Query | ✓ | str |  |

### Wikipedia API `[WikipediaAPI]`
Call Wikipedia API.
**Output:** Data, Tool

| Parameter | Req | Type | Default |
|---|---|---|---|
| Document content characters max |  | int | 4000 |
| Input |  | str |  |
| Number of results | ✓ | int | 4 |
| Language |  | str | en |
| Load all available meta |  | bool | False |

### Yahoo! Finance `[YahooFinanceTool]`
Uses [yfinance](https://pypi.org/project/yfinance/) (unofficial package) to access financial data
and market information from Yahoo! Finance.
**Output:** Data, Tool

| Parameter | Req | Type | Default |
|---|---|---|---|
| Data Method |  | str | get_news |
| Number of News |  | int | 5 |
| Stock Symbol |  | str |  |

## Prototypes

### Python Function `[PythonFunction]`
Define and execute a Python function that returns a Data object or a Message.
**Output:** Callable, Data, Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Function Code |  | code |  |

## Axa

### AXA Claim Triage `[ClaimTriageComponent]`
Classifies a claim description into a severity tier (critical / high / medium / low) and a claim
category. Returns structured Data for downstream routing.
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| Claim ID |  | str |  |
| Claim Description | ✓ | str |  |
| Default Category |  | str | Other |

## Hitl

### HITL Gate `[HitlGate]`
Pause flow for human-in-the-loop operator decision at any decision gate.
**Output:** Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Decision Context (JSON) |  | str | {} |
| Gate Name |  | str | reserve-gate |
| Decision Options (JSON) |  | str | ["approve","reject","escalate"] |
| Decision Summary |  | str |  |

## Scorers

### Braintrust Scorer `[BraintrustScorer]`
Log flow input/output to Braintrust and score with deterministic scorers.
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| Braintrust API Key | ✓ | str |  |
| Expected |  | str |  |
| Input | ✓ | str |  |
| Output | ✓ | str |  |
| Project Name | ✓ | str | Insurance Underwriting Evals |
| Scorers |  | str | all |

## Testing

### Hello World `[HelloWorldComponent]`
A test component that greets the user.
**Output:** Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Name |  | str | World |

## Faiss

### FAISS `[FAISS]`
FAISS Vector Store with search capabilities
**Output:** Data, DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| Allow Dangerous Deserialization |  | bool | False |
| Embedding |  | other |  |
| Index Name |  | str | langflow_index |
| Ingest Data |  | other |  |
| Number of Results |  | int | 4 |
| Persist Directory |  | str |  |
| Search Query |  | query |  |
| Cache Vector Store |  | bool | True |

## Notion

### Add Content to Page  `[AddContentToPage]`
Convert markdown text to Notion blocks and append them to a Notion page.
**Output:** Data, Tool

| Parameter | Req | Type | Default |
|---|---|---|---|
| Page/Block ID |  | str |  |
| Markdown Text |  | str |  |
| Notion Secret | ✓ | str |  |

### List Database Properties  `[NotionDatabaseProperties]`
Retrieve properties of a Notion database.
**Output:** Data, Tool

| Parameter | Req | Type | Default |
|---|---|---|---|
| Database ID |  | str |  |
| Notion Secret | ✓ | str |  |

### List Pages  `[NotionListPages]`
Query a Notion database with filtering and sorting. The input should be a JSON string containing the
'filter' and 'sorts' objects. Example input: {"filter": {"property": "Status", "select": {"equals":
"Done"}}, "sorts": [{"timestamp": "created_time", "direction": "descending"}]}
**Output:** Data, Tool

| Parameter | Req | Type | Default |
|---|---|---|---|
| Database ID |  | str |  |
| Notion Secret | ✓ | str |  |
| Database query (JSON) |  | str |  |

### Page Content Viewer  `[NotionPageContent]`
Retrieve the content of a Notion page as plain text.
**Output:** Data, Tool

| Parameter | Req | Type | Default |
|---|---|---|---|
| Notion Secret | ✓ | str |  |
| Page ID |  | str |  |

### Create Page  `[NotionPageCreator]`
A component for creating Notion pages.
**Output:** Data, Tool

| Parameter | Req | Type | Default |
|---|---|---|---|
| Database ID |  | str |  |
| Notion Secret | ✓ | str |  |
| Properties (JSON) |  | str |  |

### Update Page Property  `[NotionPageUpdate]`
Update the properties of a Notion page.
**Output:** Data, Tool

| Parameter | Req | Type | Default |
|---|---|---|---|
| Notion Secret | ✓ | str |  |
| Page ID |  | str |  |
| Properties |  | str |  |

### Search  `[NotionSearch]`
Searches all pages and databases that have been shared with an integration.
**Output:** Data, Tool

| Parameter | Req | Type | Default |
|---|---|---|---|
| Filter Type |  | str | page |
| Notion Secret | ✓ | str |  |
| Search Query |  | str |  |
| Sort Direction |  | str | descending |

### List Users  `[NotionUserList]`
Retrieve users from Notion.
**Output:** Data, Tool

| Parameter | Req | Type | Default |
|---|---|---|---|
| Notion Secret | ✓ | str |  |

## Agentics

### aReduce `[SemanticAggregator]`
Analyze the entire input dataframe at once and generate a new dataframe following the instruction
and the required schema
**Output:** DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| API Key |  | str |  |
| Watsonx API Endpoint |  | str | https://us-south.ml.cloud.ibm.com |
| Instructions |  | str |  |
| Language Model | ✓ | model |  |
| Ollama API URL |  | str | {'data': {'category': 'message', 'conten |
| Watsonx Project ID |  | str |  |
| As List |  | bool | False |
| Schema | ✓ | table |  |
| Input DataFrame | ✓ | other |  |

### aMap `[SemanticMap]`
Augment the input dataframe adding new columns defined in the input schema. Rows are processed
independently and in parallel using LLMs.
**Output:** DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| API Key |  | str |  |
| Keep Source Columns |  | bool | True |
| Watsonx API Endpoint |  | str | https://us-south.ml.cloud.ibm.com |
| Instructions |  | str |  |
| Language Model | ✓ | model |  |
| Ollama API URL |  | str | {'data': {'category': 'message', 'conten |
| Watsonx Project ID |  | str |  |
| As List |  | bool | False |
| Schema | ✓ | table |  |
| Input DataFrame |  | other |  |

### aGenerate `[SyntheticDataGenerator]`
Generate mock data for user defined schema. If a dataframe is provided, the component will generate
similar rows.
**Output:** DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| API Key |  | str |  |
| Watsonx API Endpoint |  | str | https://us-south.ml.cloud.ibm.com |
| Number of Rows to Generate |  | int | 10 |
| Instructions |  | str |  |
| Language Model | ✓ | model |  |
| Ollama API URL |  | str | {'data': {'category': 'message', 'conten |
| Watsonx Project ID |  | str |  |
| Schema |  | table |  |
| Input DataFrame |  | other |  |

## Agentql

### Extract Web Data `[AgentQL]`
Extracts structured data from a web page using an AgentQL query or a Natural Language description.
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| AgentQL API Key | ✓ | str |  |
| Enable screenshot |  | bool | False |
| Enable scroll to bottom |  | bool | False |
| Enable Stealth Mode (Beta) |  | bool | False |
| Request Mode |  | str | fast |
| Prompt |  | str |  |
| AgentQL Query |  | str |  |
| Timeout |  | int | 900 |
| URL | ✓ | str |  |
| Wait For |  | int | 0 |

## Aiml

### AI/ML API Embeddings `[AIMLEmbeddings]`
Generate embeddings using the AI/ML API.
**Output:** Embeddings

| Parameter | Req | Type | Default |
|---|---|---|---|
| AI/ML API Key | ✓ | str | AIML_API_KEY |
| Model Name | ✓ | str |  |

### AI/ML API `[AIMLModel]`
Generates text using AI/ML API LLMs.
**Output:** LanguageModel, Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| AI/ML API Base |  | str |  |
| AI/ML API Key | ✓ | str | AIML_API_KEY |
| Input |  | str |  |
| Max Tokens |  | int | 0 |
| Model Kwargs |  | dict | {} |
| Model Name |  | str |  |
| Stream |  | bool | False |
| System Message |  | str |  |
| Temperature |  | slider | 0.1 |

## Altk

### ALTK Agent `[ALTK Agent]`
Advanced agent with both pre-tool validation and post-tool processing capabilities.
**Output:** Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Current Date |  | bool | True |
| Agent Description [Deprecated] |  | str | A helpful assistant with access to the f |
| Model Provider |  | str | OpenAI |
| API Key |  | str |  |
| watsonx API Endpoint |  | str | https://us-south.ml.cloud.ibm.com |
| Context ID |  | str |  |
| Post Tool JSON Processing |  | bool | True |
| Tool Validation |  | bool | True |
| Output Format Instructions |  | str | You are an AI that extracts structured J |
| Handle Parse Errors |  | bool | True |
| Input |  | str |  |
| Max Iterations |  | int | 15 |
| Max Tokens |  | int | 0 |
| Language Model | ✓ | model |  |
| Number of Chat History Messages |  | int | 100 |
| Output Schema |  | table |  |
| watsonx Project ID |  | str |  |
| Response Processing Size Threshold |  | int | 100 |
| Agent Instructions |  | str | You are a helpful assistant that can use |
| Tools |  | other |  |
| Verbose |  | bool | True |

## Amazon

### Amazon Bedrock Converse `[AmazonBedrockConverseModel]`
Generate text using Amazon Bedrock LLMs with the modern Converse API for improved conversation
handling.
**Output:** LanguageModel, Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Additional Model Fields |  | dict | {} |
| AWS Access Key ID | ✓ | str | AWS_ACCESS_KEY_ID |
| AWS Secret Access Key | ✓ | str | AWS_SECRET_ACCESS_KEY |
| AWS Session Token |  | str |  |
| Credentials Profile Name |  | str |  |
| Disable Streaming |  | bool | False |
| Endpoint URL |  | str |  |
| Input |  | str |  |
| Max Tokens |  | int | 4096 |
| Model ID |  | str | anthropic.claude-3-5-sonnet-20241022-v2: |
| Region Name |  | str | us-east-1 |
| Stream |  | bool | False |
| System Message |  | str |  |
| Temperature |  | float | 0.7 |
| Top K |  | int | 250 |
| Top P |  | float | 0.9 |

### Amazon Bedrock Embeddings `[AmazonBedrockEmbeddings]`
Generate embeddings using Amazon Bedrock models.
**Output:** Embeddings

| Parameter | Req | Type | Default |
|---|---|---|---|
| AWS Access Key ID | ✓ | str | AWS_ACCESS_KEY_ID |
| AWS Secret Access Key | ✓ | str | AWS_SECRET_ACCESS_KEY |
| AWS Session Token |  | str | AWS_SESSION_TOKEN |
| Credentials Profile Name |  | str | AWS_CREDENTIALS_PROFILE_NAME |
| Endpoint URL |  | str |  |
| Model Id |  | str | amazon.titan-embed-text-v1 |
| Region Name |  | str | us-east-1 |

### Amazon Bedrock `[AmazonBedrockModel]`
Generate text using Amazon Bedrock LLMs with the legacy ChatBedrock API. This component is
deprecated. Please use Amazon Bedrock Converse instead for better compatibility, newer features, and
improved conversation handling.
**Output:** LanguageModel, Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| AWS Access Key ID | ✓ | str | AWS_ACCESS_KEY_ID |
| AWS Secret Access Key | ✓ | str | AWS_SECRET_ACCESS_KEY |
| AWS Session Token |  | str |  |
| Credentials Profile Name |  | str |  |
| Endpoint URL |  | str |  |
| Input |  | str |  |
| Model ID |  | str | anthropic.claude-3-haiku-20240307-v1:0 |
| Model Kwargs |  | dict | {} |
| Region Name |  | str | us-east-1 |
| Stream |  | bool | False |
| System Message |  | str |  |

### S3 Bucket Uploader `[s3bucketuploader]`
Uploads files to S3 bucket.
**Output:** NoneType

| Parameter | Req | Type | Default |
|---|---|---|---|
| AWS Access Key ID | ✓ | str |  |
| AWS Secret Key | ✓ | str |  |
| Bucket Name |  | str |  |
| Data Inputs | ✓ | other |  |
| S3 Prefix |  | str |  |
| Strategy for file upload |  | str | By Data |
| Strip Path | ✓ | bool | False |

## Anthropic

### Anthropic `[AnthropicModel]`
Generate text using Anthropic's Messages API and models.
**Output:** LanguageModel, Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Anthropic API Key | ✓ | str |  |
| Anthropic API URL |  | str | https://api.anthropic.com |
| Input |  | str |  |
| Max Tokens |  | int | 4096 |
| Model Name |  | str | claude-opus-4-6 |
| Stream |  | bool | False |
| System Message |  | str |  |
| Temperature |  | slider | 0.1 |
| Enable Tool Models |  | bool | False |

## Apify

### Apify Actors `[ApifyActors]`
Use Apify Actors to extract data from hundreds of places fast. This component can be used in a flow
to retrieve data or as a tool with an agent.
**Output:** Data, Tool

| Parameter | Req | Type | Default |
|---|---|---|---|
| Actor | ✓ | str | apify/website-content-crawler |
| Apify Token | ✓ | str |  |
| Output fields |  | str |  |
| Flatten output |  | bool | False |
| Run input | ✓ | str | {"startUrls":[{"url":"https://docs.apify |

## Arxiv

### arXiv `[ArXivComponent]`
Search and retrieve papers from arXiv.org
**Output:** DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| Max Results |  | int | 10 |
| Search Query |  | str |  |
| Search Field |  | str | all |

## Assemblyai

### AssemblyAI Get Subtitles `[AssemblyAIGetSubtitles]`
Export your transcript in SRT or VTT format for subtitles and closed captions
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| Assembly API Key | ✓ | str |  |
| Characters per Caption |  | int | 0 |
| Subtitle Format |  | str | srt |
| Transcription Result | ✓ | other |  |

### AssemblyAI LeMUR `[AssemblyAILeMUR]`
Apply Large Language Models to spoken data using the AssemblyAI LeMUR framework
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| Assembly API Key | ✓ | str |  |
| Endpoint |  | str | task |
| Final Model |  | str | claude3_5_sonnet |
|  Max Output Size |  | int | 2000 |
| Input Prompt | ✓ | str |  |
| Questions |  | str |  |
| Temperature |  | float | 0.0 |
| Transcript IDs |  | str |  |
| Transcription Result | ✓ | other |  |

### AssemblyAI List Transcripts `[AssemblyAIListTranscripts]`
Retrieve a list of transcripts from AssemblyAI with filtering options
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| Assembly API Key | ✓ | str |  |
| Created On |  | str |  |
| Limit |  | int | 20 |
| Status Filter |  | str | all |
| Throttled Only |  | bool | False |

### AssemblyAI Start Transcript `[AssemblyAITranscriptionJobCreator]`
Create a transcription job for an audio file using AssemblyAI with advanced options
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| Assembly API Key | ✓ | str |  |
| Audio File | ✓ | file |  |
| Audio File URL |  | str |  |
| Format Text |  | bool | True |
| Language |  | str |  |
| Automatic Language Detection |  | bool | False |
| Punctuate |  | bool | True |
| Enable Speaker Labels |  | bool | False |
| Expected Number of Speakers |  | str |  |
| Speech Model |  | str | best |

### AssemblyAI Poll Transcript `[AssemblyAITranscriptionJobPoller]`
Poll for the status of a transcription job using AssemblyAI
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| Assembly API Key | ✓ | str |  |
| Polling Interval |  | float | 3.0 |
| Transcript ID | ✓ | other |  |

## Azure

### Azure OpenAI Embeddings `[AzureOpenAIEmbeddings]`
Generate embeddings using Azure OpenAI models.
**Output:** Embeddings

| Parameter | Req | Type | Default |
|---|---|---|---|
| Azure OpenAI API Key | ✓ | str |  |
| API Version |  | str | 2023-08-01-preview |
| Deployment Name | ✓ | str |  |
| Azure Endpoint | ✓ | str |  |
| Dimensions |  | int | 0 |
| Model |  | str | text-embedding-3-small |

### Azure OpenAI `[AzureOpenAIModel]`
Generate text using Azure OpenAI LLMs.
**Output:** LanguageModel, Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Azure Chat OpenAI API Key | ✓ | str |  |
| API Version |  | str | 2024-06-01 |
| Deployment Name | ✓ | str |  |
| Azure Endpoint | ✓ | str |  |
| Input |  | str |  |
| Max Tokens |  | int | 0 |
| Stream |  | bool | False |
| System Message |  | str |  |
| Temperature |  | slider | 1.0 |

## Baidu

### Qianfan `[BaiduQianfanChatModel]`
Generate text using Baidu Qianfan LLMs.
**Output:** LanguageModel, Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Endpoint |  | str |  |
| Input |  | str |  |
| Model Name |  | str | ERNIE-4.0-8K |
| Penalty Score |  | float | 1.0 |
| Qianfan Ak |  | str |  |
| Qianfan Sk |  | str |  |
| Stream |  | bool | False |
| System Message |  | str |  |
| Temperature |  | float | 0.95 |
| Top p |  | float | 0.8 |

## Bing

### Bing Search API `[BingSearchAPI]`
Call the Bing Search API.
**Output:** DataFrame, Tool

| Parameter | Req | Type | Default |
|---|---|---|---|
| Bing Search URL |  | str |  |
| Bing Subscription Key |  | str |  |
| Input |  | str |  |
| Number of results | ✓ | int | 4 |

## Cassandra

### Cassandra `[Cassandra]`
Cassandra Vector Store with search capabilities
**Output:** Data, DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| Batch Size |  | int | 16 |
| Search Body |  | str |  |
| Cluster arguments |  | dict | {} |
| Contact Points / Astra Database ID | ✓ | str |  |
| Embedding |  | other |  |
| Enable Body Search |  | bool | False |
| Ingest Data |  | other |  |
| Keyspace | ✓ | str |  |
| Number of Results |  | int | 4 |
| Search Metadata Filter |  | dict | {} |
| Search Query |  | query |  |
| Search Score Threshold |  | float | 0.0 |
| Search Type |  | str | Similarity |
| Setup Mode |  | str | Sync |
| Cache Vector Store |  | bool | True |
| Table Name | ✓ | str |  |
| Password / Astra DB Token | ✓ | str |  |
| TTL Seconds |  | int | 0 |
| Username |  | str |  |

### Cassandra Chat Memory `[CassandraChatMemory]`
Retrieves and store chat messages from Apache Cassandra.
**Output:** Memory

| Parameter | Req | Type | Default |
|---|---|---|---|
| Cluster arguments |  | dict | {} |
| Contact Points / Astra Database ID | ✓ | str |  |
| Keyspace | ✓ | str |  |
| Session ID |  | str |  |
| Table Name | ✓ | str |  |
| Password / Astra DB Token | ✓ | str |  |
| Username |  | str |  |

### Cassandra Graph `[CassandraGraph]`
Cassandra Graph Vector Store
**Output:** Data, DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| Cluster arguments |  | dict | {} |
| Contact Points / Astra Database ID | ✓ | str |  |
| Depth of traversal |  | int | 1 |
| Embedding |  | other |  |
| Ingest Data |  | other |  |
| Keyspace | ✓ | str |  |
| Number of Results |  | int | 4 |
| Search Metadata Filter |  | dict | {} |
| Search Query |  | query |  |
| Search Score Threshold |  | float | 0.0 |
| Search Type |  | str | Traversal |
| Setup Mode |  | str | Sync |
| Cache Vector Store |  | bool | True |
| Table Name | ✓ | str |  |
| Password / Astra DB Token | ✓ | str |  |
| Username |  | str |  |

## Chroma

### Chroma DB `[Chroma]`
Chroma Vector Store with search capabilities
**Output:** Data, DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| Allow Duplicates |  | bool | False |
| Server CORS Allow Origins |  | str |  |
| Server gRPC Port |  | int | 0 |
| Server Host |  | str |  |
| Server HTTP Port |  | int | 0 |
| Server SSL Enabled |  | bool | False |
| Collection Name |  | str | langflow |
| Embedding |  | other |  |
| Ingest Data |  | other |  |
| Limit |  | int | 0 |
| Number of Results |  | int | 10 |
| Persist Directory |  | str |  |
| Search Query |  | query |  |
| Search Type |  | str | Similarity |
| Cache Vector Store |  | bool | True |

## Cleanlab

### Cleanlab Evaluator `[CleanlabEvaluator]`
Evaluates any LLM response using Cleanlab and outputs trust score and explanation.
**Output:** Message, float, number

| Parameter | Req | Type | Default |
|---|---|---|---|
| Cleanlab API Key | ✓ | str |  |
| Cleanlab Evaluation Model | ✓ | str | gpt-4o-mini |
| Prompt | ✓ | str |  |
| Quality Preset | ✓ | str | medium |
| Response | ✓ | str |  |
| System Message |  | str |  |

### Cleanlab RAG Evaluator `[CleanlabRAGEvaluator]`
Evaluates context, query, and response from a RAG pipeline using Cleanlab and outputs trust metrics.
**Output:** Data, Message, dict, float, number

| Parameter | Req | Type | Default |
|---|---|---|---|
| Cleanlab API Key | ✓ | str |  |
| Context | ✓ | str |  |
| Cleanlab Evaluation Model | ✓ | str | gpt-4o-mini |
| Quality Preset | ✓ | str | medium |
| Query | ✓ | str |  |
| Response | ✓ | str |  |
| Run Context Sufficiency |  | bool | False |
| Run Query Ease |  | bool | False |
| Run Response Groundedness |  | bool | False |
| Run Response Helpfulness |  | bool | False |

### Cleanlab Remediator `[CleanlabRemediator]`
Remediates an untrustworthy response based on trust score from the Cleanlab Evaluator, score
threshold, and message handling settings.
**Output:** Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Explanation |  | str |  |
| Fallback Answer |  | prompt | Based on the available information, I ca |
| Response | ✓ | str |  |
| Trust Score | ✓ | other |  |
| Show Untrustworthy Response |  | bool | True |
| Threshold | ✓ | float | 0.7 |
| Warning for Untrustworthy Response |  | prompt | ⚠️ WARNING: The following response is po |

## Clickhouse

### ClickHouse `[Clickhouse]`
ClickHouse Vector Store with search capabilities
**Output:** Data, DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| database | ✓ | str |  |
| Embedding |  | other |  |
| hostname | ✓ | str | localhost |
| Param of the index |  | str | 100,'L2Distance' |
| index query params |  | dict | {} |
| index_type |  | str | annoy |
| Ingest Data |  | other |  |
| metric |  | str | angular |
| Number of Results |  | int | 4 |
| Clickhouse Password | ✓ | str |  |
| port | ✓ | int | 8123 |
| Score threshold |  | float |  |
| Search Query |  | query |  |
| Use https/TLS. This overrides inferred values from the interface or port arguments. |  | bool | False |
| Cache Vector Store |  | bool | True |
| Table name | ✓ | str |  |
| The ClickHouse user name. | ✓ | str |  |

## Cloudflare

### Cloudflare Workers AI Embeddings `[CloudflareWorkersAIEmbeddings]`
Generate embeddings using Cloudflare Workers AI models.
**Output:** Embeddings

| Parameter | Req | Type | Default |
|---|---|---|---|
| Cloudflare account ID | ✓ | str |  |
| Cloudflare API base URL |  | str | https://api.cloudflare.com/client/v4/acc |
| Cloudflare API token | ✓ | str |  |
| Batch Size |  | int | 50 |
| Headers |  | dict | {} |
| Model Name | ✓ | str | @cf/baai/bge-base-en-v1.5 |
| Strip New Lines |  | bool | True |

## Cohere

### Cohere Embeddings `[CohereEmbeddings]`
Generate embeddings using Cohere models.
**Output:** Embeddings

| Parameter | Req | Type | Default |
|---|---|---|---|
| Cohere API Key | ✓ | str |  |
| Max Retries |  | int | 3 |
| Model |  | str | embed-english-v2.0 |
| Request Timeout |  | float |  |
| Truncate |  | str |  |
| User Agent |  | str | langchain |

### Cohere Language Models `[CohereModel]`
Generate text using Cohere LLMs.
**Output:** LanguageModel, Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Cohere API Key | ✓ | str | COHERE_API_KEY |
| Input |  | str |  |
| Stream |  | bool | False |
| System Message |  | str |  |
| Temperature |  | slider | 0.75 |

### Cohere Rerank `[CohereRerank]`
Rerank documents using the Cohere API.
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| Cohere API Key |  | str |  |
| Model |  | str | rerank-english-v3.0 |
| Search Query |  | str |  |
| Search Results |  | other |  |
| Top N |  | int | 3 |

## Cometapi

### CometAPI `[CometAPIModel]`
All AI Models in One API 500+ AI Models
**Output:** LanguageModel, Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| CometAPI Key | ✓ | str |  |
| App Name |  | str |  |
| Input |  | str |  |
| JSON Mode |  | bool | False |
| Max Tokens |  | int | 0 |
| Model Kwargs |  | dict | {} |
| Model | ✓ | str | Select a model |
| Seed |  | int | 1 |
| Stream |  | bool | False |
| System Message |  | str |  |
| Temperature |  | slider | 0.7 |

## Confluence

### Confluence `[Confluence]`
Confluence wiki collaboration platform
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| Confluence API Key | ✓ | str |  |
| Use Cloud? | ✓ | bool | True |
| Content Format | ✓ | str | body.storage |
| Max Pages |  | int | 1000 |
| Space Key | ✓ | str |  |
| Site URL | ✓ | str |  |
| Username | ✓ | str |  |

## Couchbase

### Couchbase `[Couchbase]`
Couchbase Vector Store with search capabilities
**Output:** Data, DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| Bucket Name | ✓ | str |  |
| Collection Name | ✓ | str |  |
| Couchbase Cluster connection string | ✓ | str |  |
| Couchbase password | ✓ | str |  |
| Couchbase username | ✓ | str |  |
| Embedding |  | other |  |
| Index Name | ✓ | str |  |
| Ingest Data |  | other |  |
| Number of Results |  | int | 4 |
| Scope Name | ✓ | str |  |
| Search Query |  | query |  |
| Cache Vector Store |  | bool | True |

## Crewai

### CrewAI Agent `[CrewAIAgentComponent]`
Represents an agent of CrewAI.
**Output:** NoneType

| Parameter | Req | Type | Default |
|---|---|---|---|
| Allow Code Execution |  | bool | False |
| Allow Delegation |  | bool | True |
| Backstory |  | str |  |
| Goal |  | str |  |
| kwargs |  | dict | {} |
| Language Model |  | other |  |
| Memory |  | bool | True |
| Role |  | str |  |
| Tools |  | other |  |
| Verbose |  | bool | False |

### Hierarchical Crew `[HierarchicalCrewComponent]`
Represents a group of agents, defining how they should collaborate and the tasks they should
perform.
**Output:** Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Agents |  | other |  |
| Function Calling LLM |  | other |  |
| Manager Agent |  | other |  |
| Manager LLM |  | other |  |
| Max RPM |  | int | 100 |
| Memory |  | bool | False |
| Share Crew |  | bool | False |
| Tasks |  | other |  |
| Cache |  | bool | True |
| Verbose |  | int | 0 |

### Hierarchical Task `[HierarchicalTaskComponent]`
Each task must have a description, an expected output and an agent responsible for execution.
**Output:** HierarchicalTask

| Parameter | Req | Type | Default |
|---|---|---|---|
| Expected Output |  | str |  |
| Description |  | str |  |
| Tools |  | other |  |

### Sequential Crew `[SequentialCrewComponent]`
Represents a group of agents with tasks that are executed sequentially.
**Output:** Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Function Calling LLM |  | other |  |
| Max RPM |  | int | 100 |
| Memory |  | bool | False |
| Share Crew |  | bool | False |
| Tasks |  | other |  |
| Cache |  | bool | True |
| Verbose |  | int | 0 |

### Sequential Task Agent `[SequentialTaskAgentComponent]`
Creates a CrewAI Task and its associated Agent.
**Output:** SequentialTask

| Parameter | Req | Type | Default |
|---|---|---|---|
| Agent kwargs |  | dict | {} |
| Allow Code Execution |  | bool | False |
| Allow Delegation |  | bool | False |
| Async Execution |  | bool | False |
| Backstory |  | str |  |
| Expected Task Output |  | str |  |
| Goal |  | str |  |
| Language Model |  | other |  |
| Memory |  | bool | True |
| Previous Task |  | other |  |
| Role |  | str |  |
| Task Description |  | str |  |
| Tools |  | other |  |
| Verbose |  | bool | True |

### Sequential Task `[SequentialTaskComponent]`
Each task must have a description, an expected output and an agent responsible for execution.
**Output:** SequentialTask

| Parameter | Req | Type | Default |
|---|---|---|---|
| Agent | ✓ | other |  |
| Async Execution |  | bool | True |
| Expected Output |  | str |  |
| Task |  | other |  |
| Description |  | str |  |
| Tools |  | other |  |

## Cuga

### Cuga `[Cuga]`
Define the Cuga agent's instructions, then assign it a task.
**Output:** Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Current Date |  | bool | True |
| Agent Description [Deprecated] |  | str | A helpful assistant with access to the f |
| Model Provider |  | str | OpenAI |
| OpenAI API Key |  | str |  |
| Enable Browser |  | bool | False |
| Decomposition Strategy |  | str | flexible |
| Handle Parse Errors |  | bool | True |
| Input |  | str |  |
| Instructions |  | str |  |
| JSON Mode |  | bool | False |
| Enable CugaLite |  | bool | True |
| CugaLite Tool Threshold |  | int | 25 |
| Max Iterations |  | int | 15 |
| Max Retries |  | int | 5 |
| Max Tokens |  | int | 0 |
| Model Kwargs |  | dict | {} |
| Model Name |  | str | gpt-4o-mini |
| Number of Chat History Messages |  | int | 100 |
| OpenAI API Base |  | str |  |
| Seed |  | int | 1 |
| Temperature |  | slider | 0.1 |
| Timeout |  | int | 700 |
| Tools |  | other |  |
| Verbose |  | bool | True |
| Web applications |  | str |  |

## Custom Component

### Custom Component `[CustomComponent]`
Use as a template to create your own component.
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| Input Value |  | str | Hello, World! |

## Data Source

### API Request `[APIRequest]`
Make HTTP requests using URL or cURL commands.
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| Body |  | table |  |
| cURL |  | str |  |
| Follow Redirects |  | bool | False |
| Headers |  | table | [{'key': 'User-Agent', 'value': 'Langflo |
| Include HTTPx Metadata |  | bool | False |
| Method |  | str | GET |
| Mode |  | tab | URL |
| Query Parameters |  | other |  |
| Save to File |  | bool | False |
| Timeout |  | int | 30 |
| URL |  | str |  |

### Load CSV `[CSVtoData]`
Load a CSV file, CSV from a file path, or a valid CSV string and convert it to a list of Data
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| CSV File |  | file |  |
| CSV File Path |  | str |  |
| CSV String |  | str |  |
| Text Key |  | str | text |

### Load JSON `[JSONtoData]`
Convert a JSON file, JSON from a file path, or a JSON string to a Data object or a list of Data
objects
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| JSON File |  | file |  |
| JSON File Path |  | str |  |
| JSON String |  | str |  |

### Mock Data `[MockDataGenerator]`
Generate mock data for testing and development.
**Output:** Data, DataFrame, Message

### News Search `[NewsSearch]`
Searches Google News via RSS. Returns clean article data.
**Output:** DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| Country:Language (ceid) |  | str | US:en |
| Country (gl) |  | str |  |
| Language (hl) |  | str |  |
| Location (Geo) |  | str |  |
| Search Query | ✓ | str |  |
| Timeout |  | int | 5 |
| Topic |  | str |  |

### RSS Reader `[RSSReaderSimple]`
Fetches and parses an RSS feed.
**Output:** DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| RSS Feed URL | ✓ | str |  |
| Timeout |  | int | 5 |

### SQL Database `[SQLComponent]`
Executes SQL queries on SQLAlchemy-compatible databases.
**Output:** DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| Add Error |  | bool | False |
| Database URL | ✓ | str |  |
| Include Columns |  | bool | True |
| SQL Query | ✓ | str |  |

### URL `[URLComponent]`
Fetch content from one or more web pages, following links recursively.
**Output:** DataFrame, Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Autoset Encoding |  | bool | True |
| Check Response Status |  | bool | False |
| Continue on Failure |  | bool | True |
| Filter Text/HTML |  | bool | True |
| Output Format |  | str | Text |
| Headers |  | table | [{'key': 'User-Agent', 'value': None}] |
| Depth |  | slider | 1 |
| Prevent Outside |  | bool | True |
| Timeout |  | int | 30 |
| URLs |  | str |  |
| Use Async |  | bool | True |

### Web Search `[UnifiedWebSearch]`
Search the web, news, or RSS feeds.
**Output:** DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| Country:Language (ceid) |  | str | US:en |
| Country (gl) |  | str |  |
| Language (hl) |  | str |  |
| Location (Geo) |  | str |  |
| Search Query | ✓ | str |  |
| Search Mode |  | tab | Web |
| Timeout |  | int | 5 |
| Topic |  | str |  |

## Datastax

### Create Assistant `[AssistantsCreateAssistant]`
Creates an Assistant and returns it's id
**Output:** Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Assistant Name |  | str |  |
| Environment Set |  | str |  |
| Instructions |  | str |  |
| Model name |  | str |  |

### Create Assistant Thread `[AssistantsCreateThread]`
Creates a thread and returns the thread id
**Output:** Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Environment Set |  | str |  |

### Get Assistant name `[AssistantsGetAssistantName]`
Assistant by id
**Output:** Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Assistant ID |  | str |  |
| Environment Set |  | str |  |

### List Assistants `[AssistantsListAssistants]`
Returns a list of assistant id's
**Output:** Message

### Run Assistant `[AssistantsRun]`
Executes an Assistant Run against a thread
**Output:** Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Assistant ID |  | str |  |
| Environment Set |  | str |  |
| Thread ID |  | str |  |
| User Message |  | str |  |

### Astra Assistant Agent `[Astra Assistant Agent]`
Manages Assistant Interactions
**Output:** Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Environment Set |  | str |  |
| File(s) for retrieval |  | file |  |
| Assistant ID (optional) |  | str |  |
| Thread ID (optional) |  | str |  |
| Tools |  | other |  |
| Agent Instructions |  | str |  |
| Model |  | str | gpt-4o-mini |
| User Message |  | str |  |

### Astra DB `[AstraDB]`
Ingest and search documents in Astra DB
**Output:** Data, DataFrame, VectorStore

| Parameter | Req | Type | Default |
|---|---|---|---|
| Search Metadata Filter |  | NestedDict | {} |
| Astra DB API Endpoint |  | str |  |
| AstraDBVectorStore Parameters |  | NestedDict | {} |
| Autodetect Collection |  | bool | True |
| Collection | ✓ | str |  |
| Content Field |  | str |  |
| Database | ✓ | str |  |
| Deletion Based On Field |  | str |  |
| Embedding Model |  | other |  |
| Environment |  | str | prod |
| Ignore Invalid Documents |  | bool | False |
| Ingest Data |  | other |  |
| Keyspace |  | str |  |
| Lexical Terms |  | query |  |
| Number of Search Results |  | int | 4 |
| Reranker |  | str |  |
| Search Method |  | str | Vector Search |
| Search Query |  | query |  |
| Search Score Threshold |  | float | 0.0 |
| Search Type |  | str | Similarity |
| Cache Vector Store |  | bool | True |
| Astra DB Application Token | ✓ | str | ASTRA_DB_APPLICATION_TOKEN |

### Astra DB CQL `[AstraDBCQLToolComponent]`
Create a tool to get transactional data from DataStax Astra DB CQL Table
**Output:** Data, Tool

| Parameter | Req | Type | Default |
|---|---|---|---|
| Astra DB API Endpoint |  | str |  |
| Autodetect Collection |  | bool | True |
| DEPRECATED: Clustering Keys |  | dict | {} |
| Collection | ✓ | str |  |
| Database | ✓ | str |  |
| Environment |  | str | prod |
| Keyspace |  | str |  |
| Number of Results |  | int | 5 |
| DEPRECATED: Partition Keys |  | dict | {} |
| Projection fields | ✓ | str | * |
| Static Filters |  | dict | {} |
| Astra DB Application Token | ✓ | str | ASTRA_DB_APPLICATION_TOKEN |
| Tool Description | ✓ | str |  |
| Tool Name | ✓ | str |  |
| Tools Parameters |  | table |  |

### Astra DB Chat Memory `[AstraDBChatMemory]`
Retrieves and stores chat messages from Astra DB.
**Output:** Memory

| Parameter | Req | Type | Default |
|---|---|---|---|
| Astra DB API Endpoint |  | str |  |
| Autodetect Collection |  | bool | True |
| Collection | ✓ | str |  |
| Database | ✓ | str |  |
| Environment |  | str | prod |
| Keyspace |  | str |  |
| Session ID |  | str |  |
| Astra DB Application Token | ✓ | str | ASTRA_DB_APPLICATION_TOKEN |

### Astra DB Graph `[AstraDBGraph]`
Implementation of Graph Vector Store using Astra DB
**Output:** Data, DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| Astra DB API Endpoint |  | str |  |
| Autodetect Collection |  | bool | True |
| Collection | ✓ | str |  |
| Database | ✓ | str |  |
| Environment |  | str | prod |
| Ingest Data |  | other |  |
| Keyspace |  | str |  |
| Metadata incoming links key |  | str |  |
| Number of Results |  | int | 4 |
| Search Metadata Filter |  | dict | {} |
| Search Query |  | query |  |
| Search Score Threshold |  | float | 0.0 |
| Search Type |  | str | MMR (Max Marginal Relevance) Graph Trave |
| Cache Vector Store |  | bool | True |
| Astra DB Application Token | ✓ | str | ASTRA_DB_APPLICATION_TOKEN |

### Astra DB Tool `[AstraDBTool]`
Tool to run hybrid vector and metadata search on DataStax Astra DB Collection
**Output:** Data, Tool

| Parameter | Req | Type | Default |
|---|---|---|---|
| Astra DB API Endpoint |  | str |  |
| Autodetect Collection |  | bool | True |
| Collection | ✓ | str |  |
| Database | ✓ | str |  |
| Environment |  | str | prod |
| Keyspace |  | str |  |
| Number of Results |  | int | 5 |
| Projection Attributes | ✓ | str | * |
| Semantic Search Instruction | ✓ | str | Search query to find relevant documents. |
| Static filters |  | dict | {} |
| Astra DB Application Token | ✓ | str | ASTRA_DB_APPLICATION_TOKEN |
| Tool Description | ✓ | str |  |
| Tool Name | ✓ | str |  |
| Tool params |  | dict | {} |
| Tools Parameters |  | table |  |
| Semantic Search |  | bool | False |
| Use Astra DB Vectorize |  | bool | False |

### Astra Vectorize `[AstraVectorize]`
Configuration options for Astra Vectorize server-side embeddings.
**Output:** dict

| Parameter | Req | Type | Default |
|---|---|---|---|
| API Key name |  | str |  |
| Authentication Parameters |  | dict | {} |
| Model Name | ✓ | str |  |
| Model Parameters |  | dict | {} |
| Provider | ✓ | str |  |
| Provider API Key |  | str |  |

### Dotenv `[Dotenv]`
Load .env file into env vars
**Output:** Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Dotenv file content |  | str |  |

### Get Environment Variable `[GetEnvVar]`
Gets the value of an environment variable from the system.
**Output:** Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Environment Variable Name |  | str |  |

### Graph RAG `[GraphRAG]`
Graph RAG traversal for vector store.
**Output:** Data, DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| Edge Definition |  | str |  |
| Embedding Model |  | other |  |
| Strategy Parameters |  | NestedDict | {} |
| Search Query |  | str |  |
| Traversal Strategies |  | str |  |
| Vector Store Connection |  | other |  |

### Hyper-Converged Database `[HCD]`
Implementation of Vector Store using Hyper-Converged Database (HCD) with search capabilities
**Output:** Data, DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| HCD API Endpoint | ✓ | str | HCD_API_ENDPOINT |
| Batch Size |  | int | 0 |
| Bulk Delete Concurrency |  | int | 0 |
| Bulk Insert Batch Concurrency |  | int | 0 |
| Bulk Insert Overwrite Concurrency |  | int | 0 |
| CA Certificate |  | str |  |
| Collection Indexing Policy |  | str |  |
| Collection Name | ✓ | str |  |
| Embedding or Astra Vectorize |  | other |  |
| Ingest Data |  | other |  |
| Metadata Indexing Exclude |  | str |  |
| Metadata Indexing Include |  | str |  |
| Metric |  | str |  |
| Namespace |  | str | default_namespace |
| Number of Results |  | int | 4 |
| HCD Password | ✓ | str | HCD_PASSWORD |
| Pre Delete Collection |  | bool | False |
| Search Metadata Filter |  | dict | {} |
| Search Query |  | query |  |
| Search Score Threshold |  | float | 0.0 |
| Search Type |  | str | Similarity |
| Setup Mode |  | str | Sync |
| Cache Vector Store |  | bool | True |
| HCD Username | ✓ | str | hcd-superuser |

## Deepseek

### DeepSeek `[DeepSeekModelComponent]`
Generate text using DeepSeek LLMs.
**Output:** LanguageModel, Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| DeepSeek API Base |  | str | https://api.deepseek.com |
| DeepSeek API Key | ✓ | str |  |
| Input |  | str |  |
| JSON Mode |  | bool | False |
| Max Tokens |  | int | 0 |
| Model Kwargs |  | dict | {} |
| Model Name |  | str | deepseek-chat |
| Seed |  | int | 1 |
| Stream |  | bool | False |
| System Message |  | str |  |
| Temperature |  | slider | 1.0 |

## Docling

### Chunk DoclingDocument `[ChunkDoclingDocument]`
Use the DocumentDocument chunkers to split the document into chunks.
**Output:** DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| Always emit headings |  | bool | False |
| Chunker |  | str | HybridChunker |
| Data or DataFrame | ✓ | other |  |
| Doc Key |  | str | doc |
| HF model name |  | str | sentence-transformers/all-MiniLM-L6-v2 |
| Maximum tokens |  | int | 0 |
| Merge peers |  | bool | True |
| OpenAI model name |  | str | gpt-4o |
| Provider |  | str | Hugging Face |

### Docling `[DoclingInline]`
Uses Docling to process input documents running the Docling models locally.
**Output:** DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| Delete Server File After Processing |  | bool | True |
| Picture classification |  | bool | False |
| Server File Path |  | other |  |
| Ignore Unspecified Files |  | bool | False |
| Ignore Unsupported Extensions |  | bool | True |
| OCR Engine |  | str | None |
| Files |  | file |  |
| Picture description LLM |  | other |  |
| Picture description prompt |  | str | Describe the image in three sentences. B |
| Pipeline |  | str | standard |
| Separator |  | str | 

 |
| Silent Errors |  | bool | False |

### Docling Serve `[DoclingRemote]`
Uses Docling to process input documents connecting to your instance of Docling Serve.
**Output:** DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| HTTP headers |  | NestedDict | {} |
| Server address | ✓ | str |  |
| Delete Server File After Processing |  | bool | True |
| Docling options |  | NestedDict | {} |
| Server File Path |  | other |  |
| Ignore Unspecified Files |  | bool | False |
| Ignore Unsupported Extensions |  | bool | True |
| Concurrency |  | int | 2 |
| Maximum poll time |  | float | 3600.0 |
| Files |  | file |  |
| Separator |  | str | 

 |
| Silent Errors |  | bool | False |

### Export DoclingDocument `[ExportDoclingDocument]`
Export DoclingDocument to markdown, html or other formats.
**Output:** Data, DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| Data or DataFrame | ✓ | other |  |
| Doc Key |  | str | doc |
| Export format |  | str | Markdown |
| Image export mode |  | str | placeholder |
| Image placeholder |  | str | <!-- image --> |
| Page break placeholder |  | str |  |

## Duckduckgo

### DuckDuckGo Search `[DuckDuckGoSearchComponent]`
Search the web using DuckDuckGo with customizable result limits
**Output:** DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| Search Query | ✓ | str |  |
| Max Results |  | int | 5 |
| Max Snippet Length |  | int | 100 |

## Elastic

### Elasticsearch `[Elasticsearch]`
Elasticsearch Vector Store with with advanced, customizable search capabilities.
**Output:** Data, DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| Elastic API Key |  | str |  |
| Elastic Cloud ID |  | str |  |
| Elasticsearch URL |  | str | http://localhost:9200 |
| Embedding |  | other |  |
| Index Name |  | str | langflow |
| Ingest Data |  | other |  |
| Number of Results |  | int | 4 |
| Elasticsearch Password |  | str |  |
| Search Query |  | query |  |
| Search Score Threshold |  | float | 0.0 |
| Search Type |  | str | similarity |
| Cache Vector Store |  | bool | True |
| Username |  | str |  |
| Verify SSL Certificates |  | bool | True |

### OpenSearch `[OpenSearchVectorStoreComponent]`
Store and search documents using OpenSearch with hybrid semantic and keyword search capabilities.
**Output:** Data, DataFrame, VectorStore

| Parameter | Req | Type | Default |
|---|---|---|---|
| Authentication Mode |  | str | basic |
| Prefix 'Bearer ' |  | bool | True |
| Document Metadata |  | table |  |
| EF Construction |  | int | 512 |
| Embedding |  | other |  |
| Vector Engine |  | str | jvector |
| Search Filters (JSON) |  | str |  |
| Index Name |  | str | langflow |
| Ingest Data |  | other |  |
| JWT Header Name |  | str | Authorization |
| JWT Token |  | str | JWT |
| M Parameter |  | int | 16 |
| Default Result Limit |  | int | 10 |
| OpenSearch URL |  | str | http://localhost:9200 |
| OpenSearch Password |  | str | admin |
| Request Timeout (seconds) |  | int | 60 |
| Search Query |  | query |  |
| Cache Vector Store |  | bool | True |
| Distance Metric |  | str | l2 |
| Use SSL/TLS |  | bool | True |
| Username |  | str | admin |
| Vector Field Name |  | str | chunk_embedding |
| Verify SSL Certificates |  | bool | False |

### OpenSearch (Multi-Model Multi-Embedding) `[OpenSearchVectorStoreComponentMultimodalMultiEmbedding]`
Store and search documents using OpenSearch with multi-model hybrid semantic and keyword search. To
search use the tools search_documents and raw_search. Search documents takes a query for vector
search, for example   {search_query: "components in openrag"}
**Output:** Data, VectorStore

| Parameter | Req | Type | Default |
|---|---|---|---|
| Authentication Mode |  | str | basic |
| Prefix 'Bearer ' |  | bool | True |
| Document Metadata |  | table |  |
| EF Construction |  | int | 512 |
| Embedding |  | other |  |
| Embedding Model Name |  | str |  |
| Vector Engine |  | str | jvector |
| Search Filters (JSON) |  | str |  |
| Index Name |  | str | langflow |
| Ingest Data |  | other |  |
| JWT Header Name |  | str | Authorization |
| JWT Token |  | str | JWT |
| M Parameter |  | int | 16 |
| Max Retries |  | str | 3 |
| Candidate Pool Size |  | int | 1000 |
| Default Result Limit |  | int | 10 |
| OpenSearch URL |  | str | http://localhost:9200 |
| OpenSearch Password |  | str | admin |
| Request Timeout (seconds) |  | str | 60 |
| Search Query |  | query |  |
| Cache Vector Store |  | bool | True |
| Distance Metric |  | str | l2 |
| Use SSL/TLS |  | bool | True |
| Username |  | str | admin |
| Legacy Vector Field Name |  | str | chunk_embedding |
| Verify SSL Certificates |  | bool | False |

## Exa

### Exa Search `[ExaSearch]`
Exa Search toolkit for search and content retrieval
**Output:** Tool

| Parameter | Req | Type | Default |
|---|---|---|---|
| Exa Search API Key |  | str |  |
| Search Number of Results |  | int | 5 |
| Similar Number of Results |  | int | 5 |
| Use Autoprompt |  | bool | True |

## Files And Knowledge

### Directory `[Directory]`
Recursively load files from a directory.
**Output:** DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| Depth |  | int | 0 |
| Load Hidden |  | bool | False |
| Max Concurrency |  | int | 2 |
| Path |  | str | . |
| Recursive |  | bool | False |
| Silent Errors |  | bool | False |
| File Types |  | str |  |
| Use Multithreading |  | bool | False |

### Read File `[File]`
Loads and returns the content from uploaded files.
**Output:** Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Advanced Parser |  | bool | False |
| AWS Access Key ID | ✓ | str |  |
| AWS Region |  | str |  |
| AWS Secret Key | ✓ | str |  |
| S3 Bucket Name | ✓ | str |  |
| Processing Concurrency |  | int | 1 |
| Delete Server File After Processing |  | bool | True |
| Doc Key |  | str | doc |
| Google Drive File ID | ✓ | str |  |
| Server File Path |  | other |  |
| File Path |  | str |  |
| Ignore Unspecified Files |  | bool | False |
| Ignore Unsupported Extensions |  | bool | True |
| Markdown Export |  | bool | False |
| Image placeholder |  | str | <!-- image --> |
| Page break placeholder |  | str |  |
| OCR Engine |  | str | easyocr |
| Files |  | file |  |
| Pipeline |  | str | standard |
| S3 File Key | ✓ | str |  |
| Separator |  | str | 

 |
| GCP Credentials Secret Key | ✓ | str |  |
| Silent Errors |  | bool | False |
| Storage Location |  | sortableList | [{'icon': 'hard-drive', 'name': 'Local'} |
| [Deprecated] Use Multithreading |  | bool | True |

### Knowledge Base `[KnowledgeBase]`
Search and retrieve data from knowledge.
**Output:** DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| Embedding Provider API Key |  | str |  |
| Include Embeddings |  | bool | False |
| Include Metadata |  | bool | True |
| Knowledge | ✓ | str |  |
| Search Query |  | str |  |
| Top K Results |  | int | 5 |

### Write File `[SaveToFile]`
Save data to local file, AWS S3, or Google Drive in the selected format.
**Output:** Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Append |  | bool | False |
| AWS Access Key ID | ✓ | str |  |
| File Format |  | str | txt |
| AWS Region |  | str |  |
| AWS Secret Key | ✓ | str |  |
| S3 Bucket Name | ✓ | str |  |
| File Name | ✓ | str |  |
| Google Drive Folder ID | ✓ | str |  |
| File Format |  | str | txt |
| File Content | ✓ | other |  |
| File Format |  | str | json |
| S3 Prefix |  | str |  |
| GCP Credentials Secret Key | ✓ | str |  |
| Storage Location |  | sortableList | [{'icon': 'hard-drive', 'name': 'Local'} |

## Firecrawl

### Firecrawl Crawl API `[FirecrawlCrawlApi]`
Crawls a URL and returns the results.
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| Firecrawl API Key | ✓ | str |  |
| Crawler Options |  | other |  |
| Idempotency Key |  | str |  |
| Scrape Options |  | other |  |
| Timeout |  | int | 0 |
| URL | ✓ | str |  |

### Firecrawl Extract API `[FirecrawlExtractApi]`
Extracts data from a URL.
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| Firecrawl API Key | ✓ | str |  |
| Enable Web Search |  | bool | False |
| Prompt | ✓ | str |  |
| Schema |  | other |  |
| URLs | ✓ | str |  |

### Firecrawl Map API `[FirecrawlMapApi]`
Maps a URL and returns the results.
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| Firecrawl API Key | ✓ | str |  |
| Ignore Sitemap |  | bool | False |
| Include Subdomains |  | bool | False |
| Sitemap Only |  | bool | False |
| URLs | ✓ | str |  |

### Firecrawl Scrape API `[FirecrawlScrapeApi]`
Scrapes a URL and returns the results.
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| Firecrawl API Key | ✓ | str |  |
| Extractor Options |  | other |  |
| Scrape Options |  | other |  |
| Timeout |  | int | 0 |
| URL | ✓ | str |  |

## Flow Controls

### If-Else `[ConditionalRouter]`
Routes an input message to a corresponding output based on text comparison.
**Output:** Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Case Sensitive |  | bool | True |
| Default Route |  | str | false_result |
| Case False |  | str |  |
| Text Input | ✓ | str |  |
| Match Text | ✓ | str |  |
| Max Iterations |  | int | 10 |
| Operator |  | str | equals |
| Case True |  | str |  |

### Condition `[DataConditionalRouter]`
Route Data object(s) based on a condition applied to a specified key, including boolean validation.
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| Match Text |  | str |  |
| Data Input |  | other |  |
| Key Name |  | str |  |
| Operator |  | str | equals |

### Flow as Tool `[FlowTool]`
Construct a Tool from a function that runs the loaded Flow.
**Output:** Tool

| Parameter | Req | Type | Default |
|---|---|---|---|
| Flow Name |  | str |  |
| Return Direct |  | bool | False |
| Description |  | str |  |
| Name |  | str |  |

### Listen `[Listen]`
A component to listen for a notification.
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| Context Key | ✓ | str |  |

### Loop `[LoopComponent]`
Iterates through Data or Message objects, processing items individually and aggregating results from
loop inputs.
**Output:** Data, DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| Inputs |  | other |  |

### Notify `[Notify]`
A component to generate a notification to Get Notified component.
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| Append |  | bool | False |
| Context Key | ✓ | str |  |
| Input Data |  | other |  |

### Pass `[Pass]`
Forwards the input message, unchanged.
**Output:** Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Ignored Message |  | str |  |
| Input Message | ✓ | str |  |

### Run Flow `[RunFlow]`
Executes another flow from within the same project. Can also be used as a tool for agents.
**Select a Flow to use the tool mode**
**Output:** —

| Parameter | Req | Type | Default |
|---|---|---|---|
| Cache Flow |  | bool | False |
| Flow ID |  | str |  |
| Flow Name |  | str |  |
| Session ID |  | str |  |

### Sub Flow `[SubFlow]`
Generates a Component from a Flow, with all of its inputs, and
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| Flow Name |  | str |  |

## Git

### GitExtractor `[GitExtractorComponent]`
Analyzes a Git repository and returns file contents and complete repository information
**Output:** Data, Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Repository URL |  | str |  |

### Git `[GitLoaderComponent]`
Load and filter documents from a local or remote Git repository. Use a local repo path or clone from
a remote URL.
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| Branch |  | str | main |
| Clone URL |  | str |  |
| Content Filter |  | str |  |
| File Filter |  | str |  |
| Local Repository Path |  | str |  |
| Repository Source | ✓ | str |  |

## Glean

### Glean Search API `[GleanSearchAPIComponent]`
Search using Glean's API.
**Output:** DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| Glean Access Token | ✓ | str |  |
| Glean API URL | ✓ | str |  |
| Page Size |  | int | 10 |
| Query | ✓ | str |  |
| Request Options |  | NestedDict | {} |

## Google

### BigQuery `[BigQueryExecutor]`
Execute SQL queries on Google BigQuery.
**Output:** DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| Clean Query |  | bool | False |
| SQL Query | ✓ | str |  |
| Upload Service Account JSON | ✓ | file |  |

### Gmail Loader `[GmailLoaderComponent]`
Loads emails from Gmail using provided credentials.
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| JSON String of the Service Account Token | ✓ | str | {
                "account": "",
        |
| Label IDs | ✓ | str | INBOX,SENT,UNREAD,IMPORTANT |
| Max Results | ✓ | str | 10 |

### Google Generative AI Embeddings `[Google Generative AI Embeddings]`
Connect to Google's generative AI embeddings service using the GoogleGenerativeAIEmbeddings class,
found in the langchain-google-genai package.
**Output:** Embeddings

| Parameter | Req | Type | Default |
|---|---|---|---|
| Google Generative AI API Key | ✓ | str |  |
| Model Name |  | str | models/text-embedding-004 |

### Google Drive Loader `[GoogleDriveComponent]`
Loads documents from Google Drive using provided credentials.
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| Document ID | ✓ | str |  |
| JSON String of the Service Account Token | ✓ | str |  |

### Google Drive Search `[GoogleDriveSearchComponent]`
Searches Google Drive files using provided credentials and query parameters.
**Output:** Data, Text

| Parameter | Req | Type | Default |
|---|---|---|---|
| Query Item | ✓ | str |  |
| Query String |  | str |  |
| Search Term | ✓ | str |  |
| Token String | ✓ | str |  |
| Valid Operator | ✓ | str |  |

### Google Generative AI `[GoogleGenerativeAIModel]`
Generate text using Google Generative AI.
**Output:** LanguageModel, Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Google API Key | ✓ | str |  |
| Input |  | str |  |
| Max Output Tokens |  | int | 0 |
| Model |  | str | gemini-2.5-flash |
| N |  | int | 0 |
| Stream |  | bool | False |
| System Message |  | str |  |
| Temperature |  | slider | 0.1 |
| Tool Model Enabled |  | bool | False |
| Top K |  | int | 0 |
| Top P |  | float |  |

### Google OAuth Token `[GoogleOAuthToken]`
Generates a JSON string with your Google OAuth token.
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| Credentials File | ✓ | file |  |
| Scopes | ✓ | str |  |

### Google Search API `[GoogleSearchAPICore]`
Call Google Search API and return results as a DataFrame.
**Output:** DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| Google API Key | ✓ | str |  |
| Google CSE ID | ✓ | str |  |
| Input |  | str |  |
| Number of results | ✓ | int | 4 |

### Google Serper API `[GoogleSerperAPICore]`
Call the Serper.dev Google Search API.
**Output:** DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| Input |  | str |  |
| Number of results | ✓ | int | 4 |
| Serper API Key | ✓ | str |  |

## Groq

### Groq `[GroqModel]`
Generate text using Groq.
**Output:** LanguageModel, Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Groq API Key |  | str |  |
| Groq API Base |  | str | https://api.groq.com |
| Input |  | str |  |
| Max Output Tokens |  | int | 0 |
| Model |  | str | llama-3.1-8b-instant |
| N |  | int | 0 |
| Stream |  | bool | False |
| System Message |  | str |  |
| Temperature |  | slider | 0.1 |
| Enable Tool Models |  | bool | False |

## Homeassistant

### Home Assistant Control `[HomeAssistantControl]`
A very simple tool to control Home Assistant devices. Only action (turn_on, turn_off, toggle) and
entity_id need to be provided.
**Output:** Data, Tool

| Parameter | Req | Type | Default |
|---|---|---|---|
| Home Assistant URL | ✓ | str |  |
| Default Action (Optional) |  | str |  |
| Default Entity ID (Optional) |  | str |  |
| Home Assistant Token | ✓ | str |  |

### List Home Assistant States `[ListHomeAssistantStates]`
Retrieve states from Home Assistant. The agent only needs to specify 'filter_domain' (optional).
Token and base_url are not exposed to the agent.
**Output:** Data, Tool

| Parameter | Req | Type | Default |
|---|---|---|---|
| Home Assistant URL | ✓ | str |  |
| Default Filter Domain (Optional) |  | str |  |
| Home Assistant Token | ✓ | str |  |

## Huggingface

### Hugging Face Embeddings Inference `[HuggingFaceInferenceAPIEmbeddings]`
Generate embeddings using Hugging Face Text Embeddings Inference (TEI)
**Output:** Embeddings

| Parameter | Req | Type | Default |
|---|---|---|---|
| HuggingFace API Key |  | str |  |
| Inference Endpoint | ✓ | str | https://api-inference.huggingface.co/mod |
| Model Name | ✓ | str | BAAI/bge-large-en-v1.5 |

### Hugging Face `[HuggingFaceModel]`
Generate text using Hugging Face Inference APIs.
**Output:** LanguageModel, Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Custom Model ID | ✓ | str |  |
| HuggingFace HubAPI Token | ✓ | str |  |
| Inference Endpoint | ✓ | str | https://api-inference.huggingface.co/mod |
| Input |  | str |  |
| Max New Tokens |  | int | 512 |
| Model ID | ✓ | str | meta-llama/Llama-3.3-70B-Instruct |
| Model Keyword Arguments |  | dict | {} |
| Repetition Penalty |  | float |  |
| Retry Attempts |  | int | 1 |
| Stream |  | bool | False |
| System Message |  | str |  |
| Task |  | str | text-generation |
| Temperature |  | slider | 0.8 |
| Top K |  | int | 0 |
| Top P |  | float | 0.95 |
| Typical P |  | float | 0.95 |

## Ibm

### IBM watsonx.ai `[IBMwatsonxModel]`
Generate text using IBM watsonx.ai foundation models.
**Output:** LanguageModel, Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Watsonx API Key | ✓ | str |  |
| watsonx API Endpoint | ✓ | str |  |
| Frequency Penalty |  | slider | 0.5 |
| Input |  | str |  |
| Logit Bias |  | str |  |
| Log Probabilities |  | bool | True |
| Max Tokens |  | int | 1000 |
| Model Name | ✓ | str |  |
| Presence Penalty |  | slider | 0.3 |
| watsonx Project ID | ✓ | str |  |
| Random Seed |  | int | 8 |
| Stop Sequence |  | str |  |
| Stream |  | bool | False |
| System Message |  | str |  |
| Temperature |  | slider | 0.1 |
| Top Log Probabilities |  | int | 3 |
| Top P |  | slider | 0.9 |

### IBM watsonx.ai Embeddings `[WatsonxEmbeddingsComponent]`
Generate embeddings using IBM watsonx.ai models.
**Output:** Embeddings

| Parameter | Req | Type | Default |
|---|---|---|---|
| Watsonx API Key | ✓ | str |  |
| Include the original text in the output |  | bool | True |
| Model Name | ✓ | str |  |
| watsonx project id | ✓ | str |  |
| Truncate Input Tokens |  | int | 200 |
| watsonx API Endpoint |  | str |  |

## Icosacomputing

### Combinatorial Reasoner `[Combinatorial Reasoner]`
Uses Combinatorial Optimization to construct an optimal prompt with embedded reasons. Sign up here:
https://forms.gle/oWNv2NKjBNaqqvCx6
**Output:** Data, Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Model Name |  | str | gpt-4o-mini |
| OpenAI API Key | ✓ | str | OPENAI_API_KEY |
| Combinatorial Reasoner Password | ✓ | str |  |
| Prompt | ✓ | str |  |
| Username | ✓ | str |  |

## Input Output

### Chat Input `[ChatInput]`
Get chat inputs from the Playground.
**Output:** Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Context ID |  | str |  |
| Files |  | file |  |
| Input Text |  | str |  |
| Sender Type |  | str | User |
| Sender Name |  | str | User |
| Session ID |  | str |  |
| Store Messages |  | bool | True |

### Chat Output `[ChatOutput]`
Display a chat message in the Playground.
**Output:** Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Basic Clean Data |  | bool | True |
| Context ID |  | str |  |
| Data Template |  | str | {text} |
| Inputs | ✓ | other |  |
| Sender Type |  | str | Machine |
| Sender Name |  | str | AI |
| Session ID |  | str |  |
| Store Messages |  | bool | True |

### Text Input `[TextInput]`
Get user text inputs.
**Output:** Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Text |  | str |  |
| Use Global Variable |  | bool | False |

### Text Output `[TextOutput]`
Sends text output via API.
**Output:** Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Inputs |  | str |  |

### Webhook `[Webhook]`
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| cURL |  | str | CURL_WEBHOOK |
| Payload |  | str |  |
| Endpoint |  | str | BACKEND_URL |

## Jigsawstack

### AI Scraper `[JigsawStackAIScraper]`
Scrape any website instantly and get consistent structured data         in seconds without writing
any css selector code
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| JigsawStack API Key | ✓ | str |  |
| Element Prompts | ✓ | str |  |
| HTML |  | str |  |
| Root Element Selector |  | str | main |
| URL |  | str |  |

### AI Web Search `[JigsawStackAISearch]`
Effortlessly search the Web and get access to high-quality results powered with AI.
**Output:** Data, Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| AI Overview |  | bool | True |
| JigsawStack API Key | ✓ | str |  |
| Query | ✓ | query |  |
| Safe Search |  | str | off |
| Spell Check |  | bool | True |

### File Read `[JigsawStackFileRead]`
Read any previously uploaded file seamlessly from         JigsawStack File Storage and use it in
your AI applications.
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| JigsawStack API Key | ✓ | str |  |
| Key | ✓ | str |  |

### File Upload `[JigsawStackFileUpload]`
Store any file seamlessly on JigsawStack File Storage and use it in your AI applications.
Supports various file types including images, documents, and more.
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| JigsawStack API Key | ✓ | str |  |
| File | ✓ | file |  |
| Key |  | str |  |
| Overwrite Existing File |  | bool | True |
| Return Temporary Public URL |  | bool | False |

### Image Generation `[JigsawStackImageGeneration]`
Generate an image based on the given text by employing AI models like Flux,         Stable
Diffusion, and other top models.
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| JigsawStack API Key | ✓ | str |  |
| Aspect Ratio |  | str |  |
| File Store Key |  | str |  |
| Guidance Scale |  | int | 0 |
| Height |  | int | 0 |
| Negative Prompt |  | str |  |
| Output Format |  | str | png |
| Prompt | ✓ | str |  |
| Seed |  | int | 0 |
| Steps |  | int | 0 |
| URL |  | str |  |
| Width |  | int | 0 |

### NSFW Detection `[JigsawStackNSFW]`
Detect if image/video contains NSFW content
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| JigsawStack API Key | ✓ | str |  |
| URL | ✓ | str |  |

### Object Detection `[JigsawStackObjectDetection]`
Perform object detection on images using JigsawStack's Object Detection Model,         capable of
image grounding, segmentation and computer use.
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| Return Annotated Image |  | bool | True |
| JigsawStack API Key | ✓ | str |  |
| Features |  | str | ['object_detection', 'gui'] |
| File Store Key |  | str |  |
| Prompts |  | str |  |
| Return Type |  | str | url |
| URL |  | str |  |

### Sentiment Analysis `[JigsawStackSentiment]`
Analyze sentiment of text using JigsawStack AI
**Output:** Data, Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| JigsawStack API Key | ✓ | str |  |
| Text | ✓ | str |  |

### Text to SQL `[JigsawStackTextToSQL]`
Convert natural language to SQL queries using JigsawStack AI
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| JigsawStack API Key | ✓ | str |  |
| File Store Key |  | str |  |
| Prompt | ✓ | query |  |
| SQL Schema |  | str |  |

### Text Translate `[JigsawStackTextTranslate]`
Translate text from one language to another with support for multiple text formats.
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| JigsawStack API Key | ✓ | str |  |
| Target Language | ✓ | str |  |
| Text | ✓ | str |  |

### VOCR `[JigsawStackVOCR]`
Extract data from any document type in a consistent structure with fine-tuned         vLLMs for the
highest accuracy
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| JigsawStack API Key | ✓ | str |  |
| File Store Key |  | str |  |
| Page Range End |  | int | 0 |
| Page Range |  | int | 0 |
| Prompts |  | str |  |
| URL |  | str |  |

## Langchain Utilities

### CSV Agent `[CSVAgent]`
Construct a CSV agent from a CSV and tools.
**Output:** AgentExecutor, Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Agent Description [Deprecated] |  | str | A helpful assistant with access to the f |
| Agent Type |  | str | openai-tools |
| Allow Dangerous Code | ✓ | bool | False |
| API Key |  | str |  |
| watsonx API Endpoint |  | str | https://us-south.ml.cloud.ibm.com |
| Handle Parse Errors |  | bool | True |
| Text | ✓ | str |  |
| Max Iterations |  | int | 15 |
| Language Model | ✓ | model |  |
| Pandas Kwargs |  | dict | {} |
| File Path | ✓ | file |  |
| watsonx Project ID |  | str |  |
| Verbose |  | bool | True |

### Character Text Splitter `[CharacterTextSplitter]`
Split text by number of characters.
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| Chunk Overlap |  | int | 200 |
| Chunk Size |  | int | 1000 |
| Input | ✓ | other |  |
| Separator |  | str |  |

### ConversationChain `[ConversationChain]`
Chain to have a conversation and load context from memory.
**Output:** Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Input | ✓ | str |  |
| Language Model | ✓ | other |  |
| Memory |  | other |  |

### HTML Link Extractor `[HtmlLinkExtractor]`
Extract hyperlinks from HTML content.
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| Input | ✓ | other |  |
| Drop URL fragments |  | bool | True |
| Kind of edge |  | str | hyperlink |

### JsonAgent `[JsonAgent]`
Construct a json agent from an LLM and tools.
**Output:** AgentExecutor, Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Agent Description [Deprecated] |  | str | A helpful assistant with access to the f |
| Handle Parse Errors |  | bool | True |
| Input |  | str |  |
| Language Model | ✓ | other |  |
| Max Iterations |  | int | 15 |
| File Path | ✓ | file |  |
| Verbose |  | bool | True |

### LLMCheckerChain `[LLMCheckerChain]`
Chain for question-answering with self-verification.
**Output:** Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Input | ✓ | str |  |
| Language Model | ✓ | other |  |

### LLMMathChain `[LLMMathChain]`
Chain that interprets a prompt and executes python code to do math.
**Output:** Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Input | ✓ | str |  |
| Language Model | ✓ | other |  |

### Prompt Hub `[LangChain Hub Prompt]`
Prompt Component that uses LangChain Hub prompts
**Output:** Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| LangChain API Key | ✓ | str |  |
| LangChain Hub Prompt | ✓ | str |  |

### Fake Embeddings `[LangChainFakeEmbeddings]`
Generate fake embeddings, useful for initial testing and connecting components.
**Output:** Embeddings

| Parameter | Req | Type | Default |
|---|---|---|---|
| Dimensions |  | int | 5 |

### Language Recursive Text Splitter `[LanguageRecursiveTextSplitter]`
Split text into chunks of a specified length based on language.
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| Chunk Overlap |  | int | 200 |
| Chunk Size |  | int | 1000 |
| Code Language |  | str | python |
| Input | ✓ | other |  |

### Natural Language Text Splitter `[NaturalLanguageTextSplitter]`
Split text based on natural language boundaries, optimized for a specified language.
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| Chunk Overlap |  | int | 200 |
| Chunk Size |  | int | 1000 |
| Input | ✓ | other |  |
| Language |  | str |  |
| Separator |  | str |  |

### OpenAI Tools Agent `[OpenAIToolsAgent]`
Agent that uses tools via openai-tools.
**Output:** AgentExecutor, Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Agent Description [Deprecated] |  | str | A helpful assistant with access to the f |
| API Key |  | str |  |
| watsonx API Endpoint |  | str | https://us-south.ml.cloud.ibm.com |
| Chat History |  | other |  |
| Handle Parse Errors |  | bool | True |
| Input |  | str |  |
| Max Iterations |  | int | 15 |
| Language Model | ✓ | model |  |
| watsonx Project ID |  | str |  |
| System Prompt |  | str | You are a helpful assistant |
| Tools |  | other |  |
| Prompt |  | str | {input} |
| Verbose |  | bool | True |

### OpenAPI Agent `[OpenAPIAgent]`
Agent to interact with OpenAPI API.
**Output:** AgentExecutor, Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Agent Description [Deprecated] |  | str | A helpful assistant with access to the f |
| Allow Dangerous Requests | ✓ | bool | False |
| API Key |  | str |  |
| watsonx API Endpoint |  | str | https://us-south.ml.cloud.ibm.com |
| Handle Parse Errors |  | bool | True |
| Input |  | str |  |
| Max Iterations |  | int | 15 |
| Language Model | ✓ | model |  |
| File Path | ✓ | file |  |
| watsonx Project ID |  | str |  |
| Verbose |  | bool | True |

### Recursive Character Text Splitter `[RecursiveCharacterTextSplitter]`
Split text trying to keep all related text together.
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| Chunk Overlap |  | int | 200 |
| Chunk Size |  | int | 1000 |
| Input | ✓ | other |  |
| Separators |  | str |  |

### Retrieval QA `[RetrievalQA]`
Chain for question-answering querying sources from a retriever.
**Output:** Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Chain Type |  | str | Stuff |
| Input | ✓ | str |  |
| Language Model | ✓ | other |  |
| Memory |  | other |  |
| Retriever | ✓ | other |  |
| Return Source Documents |  | bool | False |

### Runnable Executor `[RunnableExecutor]`
Execute a runnable. It will try to guess the input and output keys.
**Output:** Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Input Key |  | str | input |
| Input | ✓ | str |  |
| Output Key |  | str | output |
| Agent Executor | ✓ | other |  |
| Stream |  | bool | False |

### SQLAgent `[SQLAgent]`
Construct an SQL agent from an LLM and tools.
**Output:** AgentExecutor, Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Agent Description [Deprecated] |  | str | A helpful assistant with access to the f |
| API Key |  | str |  |
| watsonx API Endpoint |  | str | https://us-south.ml.cloud.ibm.com |
| Database URI | ✓ | str |  |
| Extra Tools |  | other |  |
| Handle Parse Errors |  | bool | True |
| Input |  | str |  |
| Max Iterations |  | int | 15 |
| Language Model | ✓ | model |  |
| watsonx Project ID |  | str |  |
| Verbose |  | bool | True |

### SQLDatabase `[SQLDatabase]`
SQL Database
**Output:** SQLDatabase

| Parameter | Req | Type | Default |
|---|---|---|---|
| URI | ✓ | str |  |

### Natural Language to SQL `[SQLGenerator]`
Generate SQL from natural language.
**Output:** Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| SQLDatabase | ✓ | other |  |
| Input | ✓ | str |  |
| Language Model | ✓ | other |  |
| Prompt |  | str |  |
| Top K |  | int | 5 |

### Self Query Retriever `[SelfQueryRetriever]`
Retriever that uses a vector store and an LLM to generate the vector store queries.
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| Metadata Field Info |  | other |  |
| Document Content Description |  | str |  |
| LLM |  | other |  |
| Query |  | other |  |
| Vector Store |  | other |  |

### Semantic Text Splitter `[SemanticTextSplitter]`
Split text into semantically meaningful chunks using semantic similarity.
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| Breakpoint Threshold Amount |  | float | 0.5 |
| Breakpoint Threshold Type |  | str | percentile |
| Buffer Size |  | int | 0 |
| Data Inputs | ✓ | other |  |
| Embeddings | ✓ | other |  |
| Number of Chunks |  | int | 5 |
| Sentence Split Regex |  | str |  |

### Spider Web Crawler & Scraper `[SpiderTool]`
Spider API for web crawling and scraping.
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| Blacklist |  | str |  |
| Depth |  | int | 0 |
| Limit |  | int | 0 |
| Metadata |  | bool | False |
| Mode | ✓ | str | scrape |
| Additional Parameters |  | dict | {} |
| Use Readability |  | bool | False |
| Request Timeout |  | int | 0 |
| Spider API Key | ✓ | str |  |
| URL | ✓ | str |  |
| Whitelist |  | str |  |

### Tool Calling Agent `[ToolCallingAgent]`
An agent designed to utilize various tools seamlessly within workflows.
**Output:** AgentExecutor, Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Agent Description [Deprecated] |  | str | A helpful assistant with access to the f |
| API Key |  | str |  |
| watsonx API Endpoint |  | str | https://us-south.ml.cloud.ibm.com |
| Chat Memory |  | other |  |
| Handle Parse Errors |  | bool | True |
| Input |  | str |  |
| Max Iterations |  | int | 15 |
| Language Model | ✓ | model |  |
| watsonx Project ID |  | str |  |
| System Prompt |  | str | You are a helpful assistant that can use |
| Tools |  | other |  |
| Verbose |  | bool | True |

### VectorStoreInfo `[VectorStoreInfo]`
Information about a VectorStore
**Output:** VectorStoreInfo

| Parameter | Req | Type | Default |
|---|---|---|---|
| Vector Store | ✓ | other |  |
| Description | ✓ | str |  |
| Name | ✓ | str |  |

### VectorStoreRouterAgent `[VectorStoreRouterAgent]`
Construct an agent from a Vector Store Router.
**Output:** AgentExecutor, Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Agent Description [Deprecated] |  | str | A helpful assistant with access to the f |
| Handle Parse Errors |  | bool | True |
| Input |  | str |  |
| Language Model | ✓ | other |  |
| Max Iterations |  | int | 15 |
| Vector Stores | ✓ | other |  |
| Verbose |  | bool | True |

### XML Agent `[XMLAgent]`
Agent that uses tools formatting instructions as xml to the Language Model.
**Output:** AgentExecutor, Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Agent Description [Deprecated] |  | str | A helpful assistant with access to the f |
| API Key |  | str |  |
| watsonx API Endpoint |  | str | https://us-south.ml.cloud.ibm.com |
| Chat History |  | other |  |
| Handle Parse Errors |  | bool | True |
| Input |  | str |  |
| Max Iterations |  | int | 15 |
| Language Model | ✓ | model |  |
| watsonx Project ID |  | str |  |
| System Prompt |  | str | You are a helpful assistant. Help the us |
| Tools |  | other |  |
| Prompt |  | str | {input} |
| Verbose |  | bool | True |

## Langwatch

### LangWatch Evaluator `[LangWatchEvaluator]`
Evaluates various aspects of language models using LangWatch's evaluation endpoints.
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| LangWatch API Key | ✓ | str |  |
| Contexts |  | str |  |
| Evaluator Name | ✓ | str |  |
| Expected Output |  | str |  |
| Input |  | str |  |
| Output |  | str |  |
| Timeout |  | int | 30 |

## Litellm

### LiteLLM Proxy `[LiteLLMProxyModel]`
Generate text using any LLM provider via a LiteLLM proxy with virtual key authentication.
**Output:** LanguageModel, Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| LiteLLM Proxy URL | ✓ | str | http://localhost:4000/v1 |
| Virtual Key | ✓ | str | LITELLM_API_KEY |
| Input |  | str |  |
| Max Retries |  | int | 2 |
| Max Tokens |  | int | 0 |
| Model Name | ✓ | str |  |
| Stream |  | bool | False |
| System Message |  | str |  |
| Temperature |  | slider | 0.7 |
| Timeout (seconds) |  | int | 60 |

## Llm Operations

### Batch Run `[BatchRunComponent]`
Runs an LLM on each row of a DataFrame column. If no column is specified, all columns are used.
**Output:** DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| API Key |  | str |  |
| Column Name |  | str |  |
| DataFrame | ✓ | other |  |
| Enable Metadata |  | bool | False |
| Language Model | ✓ | model |  |
| Output Column Name |  | str | model_response |
| Instructions |  | str |  |

### Guardrails `[GuardrailValidator]`
Validates input text against multiple security and safety guardrails using LLM-based detection.
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| API Key |  | str |  |
| Custom Guardrail Description |  | str |  |
| Enable Custom Guardrail |  | bool | False |
| Guardrails | ✓ | str | ['PII', 'Tokens/Passwords', 'Jailbreak'] |
| Heuristic Detection Threshold |  | slider | 0.7 |
| Input Text | ✓ | str |  |
| Language Model | ✓ | model |  |

### LLM Selector `[LLMSelectorComponent]`
Routes the input to the most appropriate LLM based on OpenRouter model specifications
**Output:** Data, Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Fallback to First Model |  | bool | True |
| Input | ✓ | str |  |
| Judge LLM | ✓ | other |  |
| Language Models | ✓ | other |  |
| Optimization |  | str | balanced |
| API Timeout |  | int | 10 |
| Use OpenRouter Specs |  | bool | True |

### Smart Transform `[Smart Transform]`
Uses an LLM to generate a function for filtering or transforming structured data and messages.
**Output:** Data, DataFrame, Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| API Key |  | str |  |
| Data | ✓ | other |  |
| Instructions | ✓ | str | Transform the data to... |
| Max Size |  | int | 30000 |
| Language Model | ✓ | model |  |
| Sample Size |  | int | 1000 |

### Smart Router `[SmartRouter]`
Routes an input message using LLM-based categorization.
**Output:** —

| Parameter | Req | Type | Default |
|---|---|---|---|
| API Key |  | str |  |
| Additional Instructions |  | str |  |
| Include Else Output |  | bool | False |
| Input | ✓ | str |  |
| Override Output |  | str |  |
| Language Model | ✓ | model |  |
| Routes | ✓ | table | [{'output_value': '', 'route_category':  |

### Structured Output `[StructuredOutput]`
Uses an LLM to generate structured data. Ideal for extraction and consistency.
**Output:** Data, DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| API Key |  | str |  |
| Input Message | ✓ | str |  |
| Language Model | ✓ | model |  |
| Output Schema | ✓ | table | [{'description': 'description of field', |
| Schema Name |  | str |  |
| Format Instructions | ✓ | str | You are an AI that extracts structured J |

## Lmstudio

### LM Studio Embeddings `[LMStudioEmbeddingsComponent]`
Generate embeddings using LM Studio.
**Output:** Embeddings

| Parameter | Req | Type | Default |
|---|---|---|---|
| LM Studio API Key |  | str | LMSTUDIO_API_KEY |
| LM Studio Base URL | ✓ | str | http://localhost:1234/v1 |
| Model | ✓ | str |  |
| Model Temperature |  | float | 0.1 |

### LM Studio `[LMStudioModel]`
Generate text using LM Studio Local LLMs.
**Output:** LanguageModel, Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| LM Studio API Key |  | str | LMSTUDIO_API_KEY |
| Base URL |  | str | http://localhost:1234/v1 |
| Input |  | str |  |
| Max Tokens |  | int | 0 |
| Model Kwargs |  | dict | {} |
| Model Name |  | str |  |
| Seed |  | int | 1 |
| Stream |  | bool | False |
| System Message |  | str |  |
| Temperature |  | float | 0.1 |

## Maritalk

### MariTalk `[Maritalk]`
Generates text using MariTalk LLMs.
**Output:** LanguageModel, Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| MariTalk API Key |  | str |  |
| Input |  | str |  |
| Max Tokens |  | int | 512 |
| Model Name |  | str | ['sabia-2-small'] |
| Stream |  | bool | False |
| System Message |  | str |  |
| Temperature |  | float | 0.1 |

## Mem0

### Mem0 Chat Memory `[mem0_chat_memory]`
Retrieves and stores chat messages using Mem0 memory storage.
**Output:** Data, Memory

| Parameter | Req | Type | Default |
|---|---|---|---|
| Existing Memory Instance |  | other |  |
| Message to Ingest |  | str |  |
| Mem0 API Key |  | str |  |
| Mem0 Configuration |  | NestedDict | {} |
| Metadata |  | dict | {} |
| OpenAI API Key |  | str |  |
| Search Query |  | str |  |
| User ID |  | str |  |

## Milvus

### Milvus `[Milvus]`
Milvus vector store with search capabilities
**Output:** Data, DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| Collection Description |  | str |  |
| Collection Name |  | str | langflow |
| Other Connection Arguments |  | dict | {} |
| Consistencey Level |  | str | Session |
| Drop Old Collection |  | bool | False |
| Embedding |  | other |  |
| Index Parameters |  | dict | {} |
| Ingest Data |  | other |  |
| Number of Results |  | int | 4 |
| Milvus Token |  | str |  |
| Primary Field Name |  | str | pk |
| Search Parameters |  | dict | {} |
| Search Query |  | query |  |
| Cache Vector Store |  | bool | True |
| Text Field Name |  | str | text |
| Timeout |  | float |  |
| Connection URI |  | str | http://localhost:19530 |
| Vector Field Name |  | str | vector |

## Mistral

### MistralAI Embeddings `[MistalAIEmbeddings]`
Generate embeddings using MistralAI models.
**Output:** Embeddings

| Parameter | Req | Type | Default |
|---|---|---|---|
| API Endpoint |  | str | https://api.mistral.ai/v1/ |
| Max Concurrent Requests |  | int | 64 |
| Max Retries |  | int | 5 |
| Mistral API Key | ✓ | str |  |
| Model |  | str | mistral-embed |
| Request Timeout |  | int | 120 |

### MistralAI `[MistralModel]`
Generates text using MistralAI LLMs.
**Output:** LanguageModel, Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Mistral API Key | ✓ | str | MISTRAL_API_KEY |
| Input |  | str |  |
| Max Concurrent Requests |  | int | 3 |
| Max Retries |  | int | 5 |
| Max Tokens |  | int | 0 |
| Mistral API Base |  | str |  |
| Model Name |  | str | codestral-latest |
| Random Seed |  | int | 1 |
| Safe Mode |  | bool | False |
| Stream |  | bool | False |
| System Message |  | str |  |
| Temperature |  | float | 0.1 |
| Timeout |  | int | 60 |
| Top P |  | float | 1.0 |

## Models And Agents

### Agent `[Agent]`
Define the agent's instructions, then enter a task to complete using tools.
**Output:** Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Current Date |  | bool | True |
| Agent Description [Deprecated] |  | str | A helpful assistant with access to the f |
| API Key |  | str |  |
| watsonx API Endpoint |  | str | https://us-south.ml.cloud.ibm.com |
| Context ID |  | str |  |
| Output Format Instructions |  | str | You are an AI that extracts structured J |
| Handle Parse Errors |  | bool | True |
| Input |  | str |  |
| Max Iterations |  | int | 15 |
| Max Tokens |  | int | 0 |
| Language Model | ✓ | model |  |
| Number of Chat History Messages |  | int | 100 |
| Output Schema |  | table |  |
| watsonx Project ID |  | str |  |
| Agent Instructions |  | str | You are a helpful assistant that can use |
| Tools |  | other |  |
| Verbose |  | bool | True |

### Embedding Model `[EmbeddingModel]`
Generate embeddings using a specified provider.
**Output:** Embeddings

| Parameter | Req | Type | Default |
|---|---|---|---|
| API Base URL |  | str |  |
| API Key |  | str |  |
| watsonx API Endpoint |  | str | https://us-south.ml.cloud.ibm.com |
| Chunk Size |  | int | 1000 |
| Dimensions |  | int | 0 |
| Include the original text in the output |  | bool | True |
| Max Retries |  | int | 3 |
| Embedding Model | ✓ | model |  |
| Model Kwargs |  | dict | {} |
| Project ID |  | str |  |
| Request Timeout |  | float |  |
| Show Progress Bar |  | bool | False |
| Truncate Input Tokens |  | int | 200 |

### Language Model `[LanguageModelComponent]`
Runs a language model given a specified provider.
**Output:** LanguageModel, Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| API Key |  | str |  |
| watsonx API Endpoint |  | str | https://us-south.ml.cloud.ibm.com |
| Input |  | str |  |
| Max Tokens |  | int | 0 |
| Language Model | ✓ | model |  |
| Ollama API URL |  | str | http://localhost:11434 |
| watsonx Project ID |  | str |  |
| Stream |  | bool | False |
| System Message |  | str |  |
| Temperature |  | slider | 0.1 |

### MCP Tools `[MCPTools]`
Connect to an MCP server to use its tools.
**Output:** DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| Headers |  | dict | {} |
| MCP Server |  | mcp | {} |
| Tool | ✓ | str |  |
| Tool Placeholder |  | str |  |
| Use Cached Server |  | bool | False |
| Verify SSL Certificate |  | bool | True |

### Message History `[Memory]`
Stores or retrieves stored chat messages from Langflow tables or an external memory.
**Output:** DataFrame, Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Context ID |  | str |  |
| External Memory |  | other |  |
| Message |  | str |  |
| Mode |  | tab | Retrieve |
| Number of Messages |  | int | 100 |
| Order | ✓ | str | Ascending |
| Sender |  | str |  |
| Sender Name |  | str |  |
| Sender Type |  | str | Machine and User |
| Session ID |  | str |  |
| Template |  | str | {sender_name}: {text} |

### Prompt Template `[Prompt Template]`
Create a prompt template with dynamic variables.
**Output:** Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Template |  | prompt |  |
| Tool Placeholder |  | str |  |
| Use Double Brackets |  | bool | False |

## Mongodb

### MongoDB Atlas `[MongoDBAtlasVector]`
MongoDB Atlas Vector Store with search capabilities
**Output:** Data, DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| Collection Name | ✓ | str |  |
| Database Name | ✓ | str |  |
| Embedding |  | other |  |
| Enable mTLS | ✓ | bool | False |
| Filter Field |  | str |  |
| Index Field | ✓ | str | embedding |
| Index Name | ✓ | str |  |
| Ingest Data |  | other |  |
| Insert Mode |  | str | append |
| MongoDB Atlas Combined Client Certificate |  | str |  |
| MongoDB Atlas Cluster URI | ✓ | str |  |
| Number of Dimensions | ✓ | int | 1536 |
| Number of Results |  | int | 4 |
| Quantization |  | str |  |
| Search Query |  | query |  |
| Cache Vector Store |  | bool | True |
| Similarity |  | str | cosine |

## Needle

### Needle Retriever `[needle]`
A retriever that uses the Needle API to search collections.
**Output:** Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Collection ID | ✓ | str |  |
| Needle API Key | ✓ | str |  |
| User Query | ✓ | str |  |
| Top K Results | ✓ | int | 20 |

## Notdiamond

### Not Diamond Router `[NotDiamond]`
Call the right model at the right time with the world's most powerful AI model router.
**Output:** Message, Text

| Parameter | Req | Type | Default |
|---|---|---|---|
| Not Diamond API Key | ✓ | str | NOTDIAMOND_API_KEY |
| Hash Content |  | bool | False |
| Input | ✓ | str |  |
| Language Models | ✓ | other |  |
| Preference ID |  | str |  |
| System Message |  | str |  |
| Tradeoff |  | str | quality |

## Novita

### Novita AI `[NovitaModel]`
Generates text using Novita AI LLMs (OpenAI compatible).
**Output:** LanguageModel, Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Novita API Key |  | str | NOVITA_API_KEY |
| Input |  | str |  |
| JSON Mode |  | bool | False |
| Max Tokens |  | int | 0 |
| Model Kwargs |  | dict | {} |
| Model Name |  | str | deepseek/deepseek-r1 |
| Output Parser |  | other |  |
| Seed |  | int | 1 |
| Stream |  | bool | False |
| System Message |  | str |  |
| Temperature |  | slider | 0.1 |

## Nvidia

### NVIDIA Embeddings `[NVIDIAEmbeddingsComponent]`
Generate embeddings using NVIDIA models.
**Output:** Embeddings

| Parameter | Req | Type | Default |
|---|---|---|---|
| NVIDIA Base URL | ✓ | str | https://integrate.api.nvidia.com/v1 |
| Model | ✓ | str | nvidia/nv-embed-v1 |
| NVIDIA API Key | ✓ | str | NVIDIA_API_KEY |
| Model Temperature |  | float | 0.1 |

### NVIDIA `[NVIDIAModelComponent]`
Generates text using NVIDIA LLMs.
**Output:** LanguageModel, Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| NVIDIA API Key |  | str | NVIDIA_API_KEY |
| NVIDIA Base URL |  | str | https://integrate.api.nvidia.com/v1 |
| Detailed Thinking |  | bool | False |
| Input |  | str |  |
| Max Tokens |  | int | 0 |
| Model Name |  | str |  |
| Seed |  | int | 1 |
| Stream |  | bool | False |
| System Message |  | str |  |
| Temperature |  | slider | 0.1 |
| Enable Tool Models |  | bool | False |

### NVIDIA Retriever Extraction `[NvidiaIngestComponent]`
Multi-modal data extraction from documents using NVIDIA's NeMo API.
**Output:** DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| NVIDIA API Key |  | str |  |
| Base URL | ✓ | str |  |
| Caption Images |  | bool | True |
| Chunk Overlap |  | int | 150 |
| Chunk size |  | int | 500 |
| Deduplicate Images |  | bool | True |
| Delete Server File After Processing |  | bool | True |
| Extract Charts |  | bool | False |
| Extract Images |  | bool | True |
| Extract Infographics |  | bool | False |
| Extract Tables |  | bool | False |
| Extract Text |  | bool | True |
| Server File Path |  | other |  |
| Filter Images |  | bool | False |
| High Resolution (PDF only) |  | bool | False |
| Ignore Unspecified Files |  | bool | False |
| Ignore Unsupported Extensions |  | bool | True |
| Maximum Aspect Ratio Filter |  | float | 5.0 |
| Minimum Aspect Ratio Filter |  | float | 0.2 |
| Minimum Image Size Filter |  | int | 128 |
| Files |  | file |  |
| Separator |  | str | 

 |
| Silent Errors |  | bool | False |
| Split Text |  | bool | True |
| Text Depth |  | str | page |

### NVIDIA Rerank `[NvidiaRerankComponent]`
Rerank documents using the NVIDIA API.
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| NVIDIA API Key |  | str |  |
| Base URL |  | str | https://integrate.api.nvidia.com/v1 |
| Model |  | str | nv-rerank-qa-mistral-4b:1 |
| Search Query |  | str |  |
| Search Results |  | other |  |
| Top N |  | int | 3 |

### NVIDIA System-Assist `[NvidiaSystemAssistComponent]`
(Windows only) Prompts NVIDIA System-Assist to interact with the NVIDIA GPU Driver. The user may
query GPU specifications, state, and ask the NV-API to perform several GPU-editing acations. The
prompt must be human-readable language.
**Output:** Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| System-Assist Prompt |  | str |  |

## Olivya

### Place Call `[OlivyaComponent]`
A component to create an outbound call request from Olivya's platform.
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| Olivya API Key | ✓ | str |  |
| Conversation History |  | str |  |
| First Message |  | str |  |
| From Number | ✓ | str |  |
| System Prompt |  | str |  |
| To Number | ✓ | str |  |

## Ollama

### Ollama Embeddings `[OllamaEmbeddings]`
Generate embeddings using Ollama models.
**Output:** Embeddings

| Parameter | Req | Type | Default |
|---|---|---|---|
| Ollama API Key |  | str |  |
| Ollama Base URL | ✓ | str | http://localhost:11434 |
| Ollama Model | ✓ | str |  |

### Ollama `[OllamaModel]`
Generate text using Ollama Local LLMs.
**Output:** Data, DataFrame, LanguageModel, Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Ollama API Key |  | str |  |
| Ollama API URL |  | str | http://localhost:11434 |
| Enable Structured Output |  | bool | False |
| Ollama Verbose Output |  | bool | False |
| Format |  | table | [{'description': 'description of field', |
| Input |  | str |  |
| Metadata |  | dict | {} |
| Mirostat |  | str | Disabled |
| Mirostat Eta |  | float |  |
| Mirostat Tau |  | float |  |
| Model Name | ✓ | str |  |
| Context Window Size |  | int | 0 |
| Number of GPUs |  | int | 0 |
| Number of Threads |  | int | 0 |
| Repeat Last N |  | int | 0 |
| Repeat Penalty |  | float |  |
| Stop Tokens |  | str |  |
| Stream |  | bool | False |
| System |  | str |  |
| System Message |  | str |  |
| Tags |  | str |  |
| Temperature |  | slider | 0.1 |
| Template |  | str |  |
| TFS Z |  | float |  |
| Timeout |  | int | 0 |
| Tool Model Enabled |  | bool | True |
| Top K |  | int | 0 |
| Top P |  | float |  |

## Openai

### OpenAI Embeddings `[OpenAIEmbeddings]`
Generate embeddings using OpenAI models.
**Output:** Embeddings

| Parameter | Req | Type | Default |
|---|---|---|---|
| Chunk Size |  | int | 1000 |
| Client |  | str |  |
| Default Headers |  | dict | {} |
| Default Query |  | dict | {} |
| Deployment |  | str |  |
| Dimensions |  | int | 0 |
| Embedding Context Length |  | int | 1536 |
| Max Retries |  | int | 3 |
| Model |  | str | text-embedding-3-small |
| Model Kwargs |  | dict | {} |
| OpenAI API Base |  | str |  |
| OpenAI API Key | ✓ | str | OPENAI_API_KEY |
| OpenAI API Type |  | str |  |
| OpenAI API Version |  | str |  |
| OpenAI Organization |  | str |  |
| OpenAI Proxy |  | str |  |
| Request Timeout |  | float |  |
| Show Progress Bar |  | bool | False |
| Skip Empty |  | bool | False |
| TikToken Enable |  | bool | True |
| TikToken Model Name |  | str |  |

### OpenAI `[OpenAIModel]`
Generates text using OpenAI LLMs.
**Output:** LanguageModel, Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| OpenAI API Key | ✓ | str | OPENAI_API_KEY |
| Input |  | str |  |
| JSON Mode |  | bool | False |
| Max Retries |  | int | 5 |
| Max Tokens |  | int | 0 |
| Model Kwargs |  | dict | {} |
| Model Name |  | str | gpt-4o-mini |
| OpenAI API Base |  | str |  |
| Seed |  | int | 1 |
| Stream |  | bool | False |
| System Message |  | str |  |
| Temperature |  | slider | 0.1 |
| Timeout |  | int | 700 |

## Openrouter

### OpenRouter `[OpenRouterComponent]`
OpenRouter provides unified access to multiple AI models from different providers through a single
API.
**Output:** LanguageModel, Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| API Key | ✓ | str |  |
| App Name |  | str |  |
| Input |  | str |  |
| Max Tokens |  | int | 0 |
| Model | ✓ | str |  |
| Site URL |  | str |  |
| Stream |  | bool | False |
| System Message |  | str |  |
| Temperature |  | slider | 0.7 |

## Perplexity

### Perplexity `[PerplexityModel]`
Generate text using Perplexity LLMs.
**Output:** LanguageModel, Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Perplexity API Key | ✓ | str |  |
| Input |  | str |  |
| Max Output Tokens |  | int | 0 |
| Model Name |  | str | llama-3.1-sonar-small-128k-online |
| N |  | int | 0 |
| Stream |  | bool | False |
| System Message |  | str |  |
| Temperature |  | slider | 0.75 |
| Top P |  | float |  |

## Pgvector

### PGVector `[pgvector]`
PGVector Vector Store with search capabilities
**Output:** Data, DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| Table | ✓ | str |  |
| Embedding | ✓ | other |  |
| Ingest Data |  | other |  |
| Number of Results |  | int | 4 |
| PostgreSQL Server Connection String | ✓ | str |  |
| Search Query |  | query |  |
| Cache Vector Store |  | bool | True |

## Pinecone

### Pinecone `[Pinecone]`
Pinecone Vector Store with search capabilities
**Output:** Data, DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| Distance Strategy |  | str | Cosine |
| Embedding |  | other |  |
| Index Name | ✓ | str |  |
| Ingest Data |  | other |  |
| Namespace |  | str |  |
| Number of Results |  | int | 4 |
| Pinecone API Key | ✓ | str |  |
| Search Query |  | query |  |
| Cache Vector Store |  | bool | True |
| Text Key |  | str | text |

## Processing

### Alter Metadata `[AlterMetadata]`
Adds/Removes Metadata Dictionary on inputs
**Output:** Data, DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| Input |  | other |  |
| Metadata | ✓ | NestedDict | {} |
| Fields to Remove |  | str |  |
| User Text |  | str |  |

### Combine Text `[CombineText]`
Concatenate two text sources into a single text chunk using a specified delimiter.
**Output:** Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Delimiter |  | str |   |
| First Text |  | str |  |
| Second Text |  | str |  |

### Create Data `[CreateData]`
Dynamically create a Data with a specified number of fields.
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| Number of Fields |  | int | 1 |
| Text Key |  | str |  |
| Text Key Validator |  | bool | False |

### Create List `[CreateList]`
Creates a list of texts.
**Output:** Data, DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| Texts |  | str |  |

### DataFrame Operations `[DataFrameOperations]`
Perform various operations on a DataFrame.
**Output:** DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| Sort Ascending |  | bool | True |
| Column Name |  | str |  |
| Columns to Select |  | str |  |
| DataFrame | ✓ | other |  |
| Filter Operator |  | str | equals |
| Filter Value |  | str |  |
| New Column Name |  | str |  |
| New Column Value |  | str |  |
| Number of Rows |  | int | 5 |
| Operation |  | sortableList |  |
| Value to Replace |  | str |  |
| Replacement Value |  | str |  |

### Data Operations `[DataOperations]`
Perform various operations on a Data object.
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| Append or Update |  | dict | {'key': 'value'} |
| Data | ✓ | other |  |
| Filter Key |  | str |  |
| Filter Values |  | dict | {} |
| JSON to Map |  | str |  |
| Operations |  | sortableList |  |
| Comparison Operator |  | str | equals |
| JQ Expression |  | str |  |
| Remove Keys |  | str |  |
| Rename Keys |  | dict | {'old_key': 'new_key'} |
| Select Keys |  | str |  |
| Select Path |  | str |  |

### Data → DataFrame `[DataToDataFrame]`
Converts one or multiple Data objects into a DataFrame. Each Data object corresponds to one row.
Fields from `.data` become columns, and the `.text` (if present) is placed in a 'text' column.
**Output:** DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| Data or Data List |  | other |  |

### Dynamic Create Data `[DynamicCreateData]`
Dynamically create a Data with a specified number of fields.
**Output:** Data, Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Input Configuration |  | table |  |
| Include Metadata |  | bool | False |

### Extract Key `[ExtractaKey]`
Extract a specific key from a Data object or a list of Data objects and return the extracted
value(s) as Data object(s).
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| Data Input |  | other |  |
| Key to Extract |  | str |  |

### Filter Data `[FilterData]`
Filters a Data object based on a list of keys.
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| Data |  | other |  |
| Filter Criteria |  | str |  |

### Filter Values `[FilterDataValues]`
Filter a list of data items based on a specified key, filter value, and comparison operator. Check
advanced options to select match comparision.
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| Filter Key |  | str | route |
| Filter Value |  | str | CMIP |
| Input Data |  | other |  |
| Comparison Operator |  | str | equals |

### JSON Cleaner `[JSONCleaner]`
Cleans the messy and sometimes incorrect JSON strings produced by LLMs so that they are fully
compliant with the JSON spec.
**Output:** Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| JSON String | ✓ | str |  |
| Normalize Unicode |  | bool | False |
| Remove Control Characters |  | bool | False |
| Validate JSON |  | bool | False |

### Combine Data `[MergeDataComponent]`
Combines data using different operations
**Output:** DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| Data Inputs | ✓ | other |  |
| Operation Type |  | str | Concatenate |

### Message to Data `[MessagetoData]`
Convert a Message object to a Data object
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| Message |  | str |  |

### Output Parser `[OutputParser]`
Transforms the output of an LLM into a specified format.
**Output:** Message, OutputParser

| Parameter | Req | Type | Default |
|---|---|---|---|
| Parser |  | str | CSV |

### Data to Message `[ParseData]`
Convert Data objects into Messages using any {field_name} from input data.
**Output:** Data, Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Data | ✓ | other |  |
| Separator |  | str | 
 |
| Template | ✓ | str | {text} |

### Parse DataFrame `[ParseDataFrame]`
Convert a DataFrame into plain text following a specified template. Each column in the DataFrame is
treated as a possible template key, e.g. {col_name}.
**Output:** Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| DataFrame |  | other |  |
| Separator |  | str | 
 |
| Template |  | str | {text} |

### Parse JSON `[ParseJSONData]`
Convert and extract JSON fields.
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| Input | ✓ | other |  |
| JQ Query | ✓ | str |  |

### Parser `[ParserComponent]`
Extracts text using a template.
**Output:** Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Data or DataFrame | ✓ | other |  |
| Mode |  | tab | Parser |
| Template | ✓ | str | Text: {text} |
| Separator |  | str | 
 |

### Regex Extractor `[RegexExtractorComponent]`
Extract patterns from text using regular expressions.
**Output:** Data, Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Input Text | ✓ | str |  |
| Regex Pattern | ✓ | str |  |

### Select Data `[SelectData]`
Select a single data from a list of data.
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| Data Index |  | int | 0 |
| Data List |  | other |  |

### Split Text `[SplitText]`
Split text into chunks based on specified criteria.
**Output:** DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| Chunk Overlap |  | int | 200 |
| Chunk Size |  | int | 1000 |
| Clean Output |  | bool | False |
| Input | ✓ | other |  |
| Keep Separator |  | str | False |
| Separator |  | str | 
 |
| Text Key |  | str | text |

### Message Store `[StoreMessage]`
Stores a chat message or text into Langflow tables or an external memory.
**Output:** Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| External Memory |  | other |  |
| Message | ✓ | str |  |
| Sender |  | str |  |
| Sender Name |  | str |  |
| Session ID |  | str |  |

### Text Operations `[TextOperations]`
Perform various text processing operations including text-to-DataFrame conversion.
**Output:** —

| Parameter | Req | Type | Default |
|---|---|---|---|
| Case Type |  | str | lowercase |
| Count Characters |  | bool | True |
| Count Lines |  | bool | True |
| Count Words |  | bool | True |
| Extract Pattern |  | str |  |
| Has Header |  | bool | True |
| Characters from Start |  | int | 100 |
| Max Matches |  | int | 10 |
| Operation |  | sortableList |  |
| Remove Empty Lines |  | bool | False |
| Remove Extra Spaces |  | bool | True |
| Remove Special Characters |  | bool | False |
| Replacement Text |  | str |  |
| Search Pattern |  | str |  |
| Characters to Strip |  | str |  |
| Strip Mode |  | str | both |
| Table Separator |  | str | \| |
| Characters from End |  | int | 100 |
| Text Input | ✓ | str |  |
| Second Text Input |  | str |  |
| Use Regex |  | bool | False |

### Type Convert `[TypeConverterComponent]`
Convert between different types (Message, Data, DataFrame)
**Output:** Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Auto Parse |  | bool | False |
| Input | ✓ | other |  |
| Output Type |  | tab | Message |

### Update Data `[UpdateData]`
Dynamically update or append data with the specified fields.
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| Number of Fields |  | int | 0 |
| Data | ✓ | other |  |
| Text Key |  | str |  |
| Text Key Validator |  | bool | False |

## Qdrant

### Qdrant `[QdrantVectorStoreComponent]`
Qdrant Vector Store with search capabilities
**Output:** Data, DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| Qdrant API Key |  | str |  |
| Collection Name | ✓ | str |  |
| Content Payload Key |  | str | page_content |
| Distance Function |  | str | Cosine |
| Embedding |  | other |  |
| gRPC Port |  | int | 6334 |
| Host |  | str | localhost |
| Ingest Data |  | other |  |
| Metadata Payload Key |  | str | metadata |
| Number of Results |  | int | 4 |
| Path |  | str |  |
| Port |  | int | 6333 |
| Prefix |  | str |  |
| Search Query |  | query |  |
| Cache Vector Store |  | bool | True |
| Timeout |  | int | 0 |
| URL |  | str |  |

## Redis

### Redis `[Redis]`
Implementation of Vector Store using Redis
**Output:** Data, DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| Embedding |  | other |  |
| Ingest Data |  | other |  |
| Number of Results |  | int | 4 |
| Redis Index |  | str |  |
| Redis Server Connection String | ✓ | str |  |
| Schema |  | str |  |
| Search Query |  | query |  |
| Cache Vector Store |  | bool | True |

### Redis Chat Memory `[RedisChatMemory]`
Retrieves and store chat messages from Redis.
**Output:** Memory

| Parameter | Req | Type | Default |
|---|---|---|---|
| database | ✓ | str | 0 |
| hostname | ✓ | str | localhost |
| Key prefix |  | str |  |
| Redis Password |  | str |  |
| port | ✓ | int | 6379 |
| Session ID |  | str |  |
| Username |  | str |  |

## Sambanova

### SambaNova `[SambaNovaModel]`
Generate text using Sambanova LLMs.
**Output:** LanguageModel, Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Sambanova API Key | ✓ | str | SAMBANOVA_API_KEY |
| SambaNova Cloud Base Url |  | str |  |
| Input |  | str |  |
| Max Tokens |  | int | 2048 |
| Model Name |  | str | Meta-Llama-3.3-70B-Instruct |
| Stream |  | bool | False |
| System Message |  | str |  |
| Temperature |  | slider | 0.1 |
| top_p |  | slider | 1.0 |

## Scrapegraph

### ScrapeGraph Markdownify API `[ScrapeGraphMarkdownifyApi]`
Given a URL, it will return the markdownified content of the website.
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| ScrapeGraph API Key | ✓ | str |  |
| URL |  | str |  |

### ScrapeGraph Search API `[ScrapeGraphSearchApi]`
Given a search prompt, it will return search results using ScrapeGraph's search functionality.
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| ScrapeGraph API Key | ✓ | str |  |
| Search Prompt |  | str |  |

### ScrapeGraph Smart Scraper API `[ScrapeGraphSmartScraperApi]`
Given a URL, it will return the structured data of the website.
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| ScrapeGraph API Key | ✓ | str |  |
| Prompt |  | str |  |
| URL |  | str |  |

## Searchapi

### SearchApi `[SearchComponent]`
Calls the SearchApi API with result limiting. Supports Google, Bing and DuckDuckGo.
**Output:** DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| SearchAPI API Key | ✓ | str |  |
| Engine |  | str | google |
| Input |  | str |  |
| Max Results |  | int | 5 |
| Max Snippet Length |  | int | 100 |
| Search parameters |  | dict | {} |

## Serpapi

### Serp Search API `[Serp]`
Call Serp Search API with result limiting
**Output:** Data, Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Input |  | str |  |
| Max Results |  | int | 5 |
| Max Snippet Length |  | int | 100 |
| Parameters |  | dict | {} |
| SerpAPI API Key | ✓ | str |  |

## Supabase

### Supabase `[SupabaseVectorStore]`
Supabase Vector Store with search capabilities
**Output:** Data, DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| Embedding |  | other |  |
| Ingest Data |  | other |  |
| Number of Results |  | int | 4 |
| Query Name |  | str |  |
| Search Query |  | query |  |
| Cache Vector Store |  | bool | True |
| Supabase Service Key | ✓ | str |  |
| Supabase URL | ✓ | str |  |
| Table Name |  | str |  |

## Tavily

### Tavily Extract API `[TavilyExtractComponent]`
**Tavily Extract** extract raw content from URLs.
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| Tavily API Key | ✓ | str |  |
| Extract Depth |  | str | basic |
| Include Images |  | bool | False |
| URLs | ✓ | str |  |

### Tavily Search API `[TavilySearchComponent]`
**Tavily Search** is a search engine optimized for LLMs and RAG,         aimed at efficient, quick,
and persistent search results.
**Output:** DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| Tavily API Key | ✓ | str |  |
| Chunks Per Source |  | int | 3 |
| Days |  | int | 7 |
| Exclude Domains |  | str |  |
| Include Answer |  | bool | True |
| Include Domains |  | str |  |
| Include Images |  | bool | True |
| Include Raw Content |  | bool | False |
| Max Results |  | int | 5 |
| Search Query |  | str |  |
| Search Depth |  | str | advanced |
| Time Range |  | str |  |
| Search Topic |  | str | general |

## Twelvelabs

### Convert Astra DB to Pegasus Input `[ConvertAstraToTwelveLabs]`
Converts Astra DB search results to inputs compatible with TwelveLabs Pegasus.
**Output:** Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Astra DB Results | ✓ | other |  |

### Split Video `[SplitVideo]`
Split a video into multiple clips of specified duration.
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| Clip Duration (seconds) | ✓ | int | 30 |
| Include Original Video |  | bool | False |
| Last Clip Handling | ✓ | str | Overlap Previous |
| Video Data | ✓ | other |  |

### TwelveLabs Pegasus `[TwelveLabsPegasus]`
Chat with videos using TwelveLabs Pegasus API.
**Output:** Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| TwelveLabs API Key | ✓ | str |  |
| Index ID |  | str |  |
| Index Name |  | str |  |
| Prompt | ✓ | str |  |
| Model |  | str | pegasus1.2 |
| Temperature |  | slider | 0.7 |
| Pegasus Video ID |  | str |  |
| Video Data |  | other |  |

### TwelveLabs Pegasus Index Video `[TwelveLabsPegasusIndexVideo]`
Index videos using TwelveLabs and add the video_id to metadata.
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| TwelveLabs API Key | ✓ | str |  |
| Index ID |  | str |  |
| Index Name |  | str |  |
| Model |  | str | pegasus1.2 |
| Video Data | ✓ | other |  |

### TwelveLabs Text Embeddings `[TwelveLabsTextEmbeddings]`
Generate embeddings using TwelveLabs text embedding models.
**Output:** Embeddings

| Parameter | Req | Type | Default |
|---|---|---|---|
| TwelveLabs API Key | ✓ | str | TWELVELABS_API_KEY |
| Max Retries |  | int | 3 |
| Model |  | str | Marengo-retrieval-2.7 |
| Request Timeout |  | float |  |

### TwelveLabs Video Embeddings `[TwelveLabsVideoEmbeddings]`
Generate embeddings from videos using TwelveLabs video embedding models.
**Output:** Embeddings

| Parameter | Req | Type | Default |
|---|---|---|---|
| TwelveLabs API Key | ✓ | str |  |
| Model |  | str | Marengo-retrieval-2.7 |
| Request Timeout |  | int | 0 |

### Video File `[VideoFile]`
Load a video file in common video formats.
**Output:** DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| Video File | ✓ | file |  |

## Unstructured

### Unstructured API `[Unstructured]`
Uses Unstructured.io API to extract clean text from raw source documents. Supports a wide range of
file types.
**Output:** DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| Unstructured.io Serverless API Key | ✓ | str |  |
| Unstructured.io API URL |  | str |  |
| Chunking Strategy |  | str |  |
| Delete Server File After Processing |  | bool | True |
| Server File Path |  | other |  |
| Ignore Unspecified Files |  | bool | False |
| Ignore Unsupported Extensions |  | bool | True |
| Files |  | file |  |
| Separator |  | str | 

 |
| Silent Errors |  | bool | False |
| Additional Arguments |  | NestedDict | {} |

## Upstash

### Upstash `[Upstash]`
Upstash Vector Store with search capabilities
**Output:** Data, DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| Embedding |  | other |  |
| Upstash Index Token | ✓ | str |  |
| Index URL | ✓ | str |  |
| Ingest Data |  | other |  |
| Metadata Filter |  | str |  |
| Namespace |  | str |  |
| Number of Results |  | int | 4 |
| Search Query |  | query |  |
| Cache Vector Store |  | bool | True |
| Text Key |  | str | text |

## Utilities

### Calculator `[CalculatorComponent]`
Perform basic arithmetic operations on a given expression.
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| Expression |  | str |  |

### Current Date `[CurrentDate]`
Returns the current date and time in the selected timezone.
**Output:** Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Timezone |  | str | UTC |

### ID Generator `[IDGenerator]`
Generates a unique ID.
**Output:** Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Value |  | str |  |

### Python Interpreter `[PythonREPLComponent]`
Run Python code with optional imports. Use print() to see the output.
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| Global Imports | ✓ | str | math,pandas |
| Python Code | ✓ | str | print('Hello, World!') |

## Vectara

### Vectara `[Vectara]`
Vectara Vector Store with search capabilities
**Output:** Data, DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| Embedding |  | other |  |
| Ingest Data |  | other |  |
| Number of Results |  | int | 4 |
| Search Query |  | query |  |
| Cache Vector Store |  | bool | True |
| Vectara API Key | ✓ | str |  |
| Vectara Corpus ID | ✓ | str |  |
| Vectara Customer ID | ✓ | str |  |

### Vectara RAG `[VectaraRAG]`
Vectara's full end to end RAG
**Output:** Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Diversity Bias |  | float | 0.2 |
| Metadata Filters |  | str |  |
| Hybrid Search Factor |  | float | 0.005 |
| Max Results to Summarize |  | int | 7 |
| Prompt Name |  | str | vectara-summary-ext-24-05-sml |
| Reranker Type |  | str | mmr |
| Number of Results to Rerank |  | int | 50 |
| Response Language |  | str | eng |
| Search Query |  | str |  |
| Vectara API Key | ✓ | str |  |
| Vectara Corpus ID | ✓ | str |  |
| Vectara Customer ID | ✓ | str |  |

## Vertexai

### Vertex AI Embeddings `[VertexAIEmbeddings]`
Generate embeddings using Google Cloud Vertex AI models.
**Output:** Embeddings

| Parameter | Req | Type | Default |
|---|---|---|---|
| Credentials | ✓ | file |  |
| Location |  | str | us-central1 |
| Max Output Tokens |  | int | 0 |
| Max Retries |  | int | 1 |
| Model Name | ✓ | str | textembedding-gecko |
| N |  | int | 1 |
| Project |  | str |  |
| Request Parallelism |  | int | 5 |
| Stop |  | str |  |
| Streaming |  | bool | False |
| Temperature |  | float | 0.0 |
| Top K |  | int | 0 |
| Top P |  | float | 0.95 |

### Vertex AI `[VertexAiModel]`
Generate text using Vertex AI LLMs.
**Output:** LanguageModel, Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Credentials |  | file |  |
| Input |  | str |  |
| Location |  | str | us-central1 |
| Max Output Tokens |  | int | 0 |
| Max Retries |  | int | 1 |
| Model Name |  | str | gemini-1.5-pro |
| Project |  | str |  |
| Stream |  | bool | False |
| System Message |  | str |  |
| Temperature |  | float | 0.0 |
| Top K |  | int | 0 |
| Top P |  | float | 0.95 |
| Verbose |  | bool | False |

## Vllm

### vLLM Embeddings `[vLLMEmbeddings]`
Generate embeddings using vLLM models via OpenAI-compatible API.
**Output:** Embeddings

| Parameter | Req | Type | Default |
|---|---|---|---|
| vLLM API Base |  | str | http://localhost:8000/v1 |
| API Key |  | str |  |
| Chunk Size |  | int | 1000 |
| Default Headers |  | dict | {} |
| Default Query |  | dict | {} |
| Dimensions |  | int | 0 |
| Max Retries |  | int | 3 |
| Model Kwargs |  | dict | {} |
| Model Name |  | str | BAAI/bge-large-en-v1.5 |
| Request Timeout |  | float |  |
| Show Progress Bar |  | bool | False |
| Skip Empty |  | bool | False |

### vLLM `[vLLMModel]`
Generates text using vLLM models via OpenAI-compatible API.
**Output:** LanguageModel, Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| vLLM API Base |  | str | http://localhost:8000/v1 |
| API Key |  | str |  |
| Input |  | str |  |
| JSON Mode |  | bool | False |
| Max Retries |  | int | -1 |
| Max Tokens |  | int | 0 |
| Model Kwargs |  | dict | {} |
| Model Name |  | str | ibm-granite/granite-3.3-8b-instruct |
| Seed |  | int | -1 |
| Stream |  | bool | False |
| System Message |  | str |  |
| Temperature |  | slider | 0.1 |
| Timeout |  | int | -1 |

## Vlmrun

### VLM Run Transcription `[VLMRunTranscription]`
Extract structured data from audio and video using [VLM Run AI](https://app.vlm.run)
**Output:** Data

| Parameter | Req | Type | Default |
|---|---|---|---|
| VLM Run API Key | ✓ | str |  |
| Processing Domain |  | str | transcription |
| Media Files |  | file |  |
| Media Type |  | str | audio |
| Media URL |  | str |  |
| Timeout (seconds) |  | int | 600 |

## Weaviate

### Weaviate `[Weaviate]`
Weaviate Vector Store with search capabilities
**Output:** Data, DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| API Key |  | str |  |
| Embedding |  | other |  |
| Index Name | ✓ | str |  |
| Ingest Data |  | other |  |
| Number of Results |  | int | 4 |
| Search By Text |  | bool | False |
| Search Query |  | query |  |
| Cache Vector Store |  | bool | True |
| Text Key |  | str | text |
| Weaviate URL | ✓ | str | http://localhost:8080 |

## Wikipedia

### Wikidata `[WikidataComponent]`
Performs a search using the Wikidata API.
**Output:** DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| Query | ✓ | str |  |

### Wikipedia `[WikipediaComponent]`
Call Wikipedia API.
**Output:** DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| Document content characters max |  | int | 4000 |
| Input |  | str |  |
| Number of results | ✓ | int | 4 |
| Language |  | str | en |
| Load all available meta |  | bool | False |

## Wolframalpha

### WolframAlpha API `[WolframAlphaAPI]`
Enables queries to WolframAlpha for computational data, facts, and calculations across various
topics, delivering structured responses.
**Output:** DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| WolframAlpha App ID | ✓ | str |  |
| Input Query |  | str |  |

## Xai

### xAI `[xAIModel]`
Generates text using xAI models like Grok.
**Output:** LanguageModel, Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| xAI API Key | ✓ | str | XAI_API_KEY |
| xAI API Base |  | str | https://api.x.ai/v1 |
| Input |  | str |  |
| JSON Mode |  | bool | False |
| Max Tokens |  | int | 0 |
| Model Kwargs |  | dict | {} |
| Model Name |  | str | grok-2-latest |
| Seed |  | int | 1 |
| Stream |  | bool | False |
| System Message |  | str |  |
| Temperature |  | slider | 0.1 |

## Yahoosearch

### Yahoo! Finance `[YfinanceComponent]`
Uses [yfinance](https://pypi.org/project/yfinance/) (unofficial package) to access financial data
and market information from Yahoo! Finance.
**Output:** DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| Data Method |  | str | get_news |
| Number of News |  | int | 5 |
| Stock Symbol |  | str |  |

## Youtube

### YouTube Channel `[YouTubeChannelComponent]`
Retrieves detailed information and statistics about YouTube channels as a DataFrame.
**Output:** DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| YouTube API Key | ✓ | str |  |
| Channel URL or ID | ✓ | str |  |
| Include Branding |  | bool | True |
| Include Playlists |  | bool | False |
| Include Statistics |  | bool | True |

### YouTube Comments `[YouTubeCommentsComponent]`
Retrieves and analyzes comments from YouTube videos.
**Output:** DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| YouTube API Key | ✓ | str |  |
| Include Metrics |  | bool | True |
| Include Replies |  | bool | False |
| Max Results |  | int | 20 |
| Sort By |  | str | relevance |
| Video URL | ✓ | str |  |

### YouTube Playlist `[YouTubePlaylistComponent]`
Extracts all video URLs from a YouTube playlist.
**Output:** DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| Playlist URL | ✓ | str |  |

### YouTube Search `[YouTubeSearchComponent]`
Searches YouTube videos based on query.
**Output:** DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| YouTube API Key | ✓ | str |  |
| Include Metadata |  | bool | True |
| Max Results |  | int | 10 |
| Sort Order |  | str | relevance |
| Search Query | ✓ | str |  |

### YouTube Transcripts `[YouTubeTranscripts]`
Extracts spoken content from YouTube videos with multiple output options.
**Output:** Data, DataFrame, Message

| Parameter | Req | Type | Default |
|---|---|---|---|
| Chunk Size (seconds) |  | int | 60 |
| Translation Language |  | str |  |
| Video URL | ✓ | str |  |

### YouTube Trending `[YouTubeTrendingComponent]`
Retrieves trending videos from YouTube with filtering options.
**Output:** DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| YouTube API Key | ✓ | str |  |
| Category |  | str | All |
| Include Content Details |  | bool | True |
| Include Statistics |  | bool | True |
| Include Thumbnails |  | bool | True |
| Max Results |  | int | 10 |
| Region |  | str | Global |

### YouTube Video Details `[YouTubeVideoDetailsComponent]`
Retrieves detailed information and statistics about YouTube videos.
**Output:** DataFrame

| Parameter | Req | Type | Default |
|---|---|---|---|
| YouTube API Key | ✓ | str |  |
| Include Content Details |  | bool | True |
| Include Statistics |  | bool | True |
| Include Tags |  | bool | True |
| Include Thumbnails |  | bool | True |
| Video URL | ✓ | str |  |

## Zep

### Zep Chat Memory `[ZepChatMemory]`
Retrieves and store chat messages from Zep.
**Output:** Memory

| Parameter | Req | Type | Default |
|---|---|---|---|
| API Base Path |  | str | api/v1 |
| Zep API Key |  | str |  |
| Session ID |  | str |  |
| Zep URL |  | str |  |


## Composio

Composio provides 60+ pre-built connectors. Each connector is a separate Langflow component.

- **Composio Tools** `[ComposioAPI]`
- **AgentQL** `[ComposioAgentQLAPIComponent]`
- **Agiled** `[ComposioAgiledAPIComponent]`
- **Airtable** `[ComposioAirtableAPIComponent]`
- **Apollo** `[ComposioApolloAPIComponent]`
- **Asana** `[ComposioAsanaAPIComponent]`
- **Attio** `[ComposioAttioAPIComponent]`
- **Bitbucket** `[ComposioBitbucketAPIComponent]`
- **Bolna** `[ComposioBolnaAPIComponent]`
- **Brightdata** `[ComposioBrightdataAPIComponent]`
- **Calendly** `[ComposioCalendlyAPIComponent]`
- **Canva** `[ComposioCanvaAPIComponent]`
- **Canvas** `[ComposioCanvasAPIComponent]`
- **Coda** `[ComposioCodaAPIComponent]`
- **Contentful** `[ComposioContentfulAPIComponent]`
- **Digicert** `[ComposioDigicertAPIComponent]`
- **Discord** `[ComposioDiscordAPIComponent]`
- **Dropbox** `[ComposioDropboxAPIComponent]`
- **ElevenLabs** `[ComposioElevenLabsAPIComponent]`
- **Exa** `[ComposioExaAPIComponent]`
- **Figma** `[ComposioFigmaAPIComponent]`
- **Finage** `[ComposioFinageAPIComponent]`
- **Firecrawl** `[ComposioFirecrawlAPIComponent]`
- **Fireflies** `[ComposioFirefliesAPIComponent]`
- **Fixer** `[ComposioFixerAPIComponent]`
- **Flexisign** `[ComposioFlexisignAPIComponent]`
- **Freshdesk** `[ComposioFreshdeskAPIComponent]`
- **GitHub** `[ComposioGitHubAPIComponent]`
- **Gmail** `[ComposioGmailAPIComponent]`
- **GoogleBigQuery** `[ComposioGoogleBigQueryAPIComponent]`
- **GoogleCalendar** `[ComposioGoogleCalendarAPIComponent]`
- **GoogleDocs** `[ComposioGoogleDocsAPIComponent]`
- **GoogleSheets** `[ComposioGoogleSheetsAPIComponent]`
- **GoogleTasks** `[ComposioGoogleTasksAPIComponent]`
- **Google Classroom** `[ComposioGoogleclassroomAPIComponent]`
- **GoogleMeet** `[ComposioGooglemeetAPIComponent]`
- **Heygen** `[ComposioHeygenAPIComponent]`
- **Instagram** `[ComposioInstagramAPIComponent]`
- **Jira** `[ComposioJiraAPIComponent]`
- **Jotform** `[ComposioJotformAPIComponent]`
- **Klaviyo** `[ComposioKlaviyoAPIComponent]`
- **Linear** `[ComposioLinearAPIComponent]`
- **Listennotes** `[ComposioListennotesAPIComponent]`
- **Mem0** `[ComposioMem0APIComponent]`
- **Miro** `[ComposioMiroAPIComponent]`
- **Missive** `[ComposioMissiveAPIComponent]`
- **Notion** `[ComposioNotionAPIComponent]`
- **OneDrive** `[ComposioOneDriveAPIComponent]`
- **Outlook** `[ComposioOutlookAPIComponent]`
- **Pandadoc** `[ComposioPandadocAPIComponent]`
- **PeopleDataLabs** `[ComposioPeopleDataLabsAPIComponent]`
- **PerplexityAI** `[ComposioPerplexityAIAPIComponent]`
- **Reddit** `[ComposioRedditAPIComponent]`
- **SerpAPI** `[ComposioSerpAPIComponent]`
- **Slack** `[ComposioSlackAPIComponent]`
- **Slackbot** `[ComposioSlackbotAPIComponent]`
- **Snowflake** `[ComposioSnowflakeAPIComponent]`
- **Supabase** `[ComposioSupabaseAPIComponent]`
- **Tavily** `[ComposioTavilyAPIComponent]`
- **TimelinesAI** `[ComposioTimelinesAIAPIComponent]`
- **Todoist** `[ComposioTodoistAPIComponent]`
- **Wrike** `[ComposioWrikeAPIComponent]`
- **YouTube** `[ComposioYoutubeAPIComponent]`
