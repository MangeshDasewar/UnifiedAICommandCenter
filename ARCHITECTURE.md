# System Architecture - Unified AI Command Centre

## High-Level Architecture

\`\`\`
┌─────────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js 16)                      │
│                     - Dashboard                                 │
│                     - Messaging Interface                       │
│                     - Conversation Viewer                       │
│                     - Template Manager                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Layer (Next.js Routes)                   │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ /api/users   │  │ /api/templates│  │/api/workflows│         │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │/api/notif... │  │/api/conversa..│  │/api/analytics│         │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                         │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          Workflow Engine (workflow-engine.ts)            │  │
│  │  - Start workflows                                       │  │
│  │  - Execute steps                                         │  │
│  │  - Track progress                                        │  │
│  │  - Handle escalations                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          AI Utilities (ai-utils.ts)                      │  │
│  │  - Language detection                                    │  │
│  │  - Intent classification                                 │  │
│  │  - Sentiment analysis                                    │  │
│  │  - Auto-response generation                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          TTS/ASR Module (tts-asr.ts)                     │  │
│  │  - Text-to-speech (supports 4 languages)                 │  │
│  │  - Speech-to-text recognition                            │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Data Layer                                 │
│                                                                 │
│         SQLite Database (data/ghar-pey.db)                      │
│                                                                 │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐  │
│  │   users    │ │  templates │ │ workflows  │ │ notif...   │  │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘  │
│                                                                 │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐  │
│  │ conversat..│ │  intents   │ │ analytics  │ │workflow... │  │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘  │
└─────────────────────────────────────────────────────────────────┘
\`\`\`

## Component Architecture

### Frontend Components

\`\`\`
Page (app/page.tsx)
├── Header
├── TabsComponent
│   ├── Dashboard (dashboard.tsx)
│   │   ├── StatsCards
│   │   ├── DeliveryChart
│   │   ├── WorkflowDistribution
│   │   └── ChannelPerformance
│   │
│   ├── NotificationEngine (notification-engine.tsx)
│   │   ├── ChannelTabs (WhatsApp, Email, Voice)
│   │   ├── RecipientInput
│   │   ├── MessageComposer
│   │   ├── QuickTemplates
│   │   └── AIReplyEngine
│   │
│   ├── ConversationViewer (conversation-viewer.tsx)
│   │   ├── ConversationList
│   │   ├── ConversationDetail
│   │   └── Analysis
│   │
│   └── TemplateManager (template-manager.tsx)
│       ├── TemplateList
│       ├── TemplateForm
│       └── TemplateDetail
│
└── Footer
\`\`\`

### Data Flow

\`\`\`
User Action
    │
    ▼
React Component (Client)
    │
    ▼
API Route Handler
    │
    ├── Validate Request
    ├── Call Business Logic
    └── Database Operation
    │
    ▼
Database Query
    │
    ├── CRUD Operation
    ├── Data Processing
    └── Return Result
    │
    ▼
API Response JSON
    │
    ▼
React Component (Update State)
    │
    ▼
UI Re-render
\`\`\`

## Database Schema Relationships

\`\`\`
users
  │
  ├──► workflow_instances ──► workflows
  ├──► notifications ──► templates
  ├──► conversations ──► intents
  └──► analytics

workflow_steps
  │
  ├──► workflows
  └──► templates

notifications
  │
  ├──► users
  ├──► templates
  └──► workflow_instances
\`\`\`

## AI Processing Pipeline

\`\`\`
Incoming Message
    │
    ▼
┌─────────────────────┐
│ Language Detection  │
│ (detectLanguage)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Intent Classification│
│ (classifyIntent)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Sentiment Analysis  │
│ (analyzeSentiment)  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Store Conversation  │
│ With Metadata       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Generate Response   │
│ (generateAutoResp)  │
└──────────┬──────────┘
           │
           ▼
Response Sent to User
\`\`\`

## Multi-Language Support

### Language Detection Algorithm

\`\`\`
Text Input
    │
    ▼
Check Unicode Ranges
    │
├─► Kannada (U+0C80–U+0CFF) ──► 'kannada'
├─► Hindi (U+0900–U+097F) ──► 'hindi'
├─► Nepali (U+0900–U+097F) ──► 'nepali'
└─► Default ──► 'en'
\`\`\`

### Response Generation by Language

\`\`\`
Intent + Language + User Name
    │
    ▼
Lookup Response Template
(responses[intent][language])
    │
    ▼
Substitute Variables
    │
    ▼
Send Response in User's Language
\`\`\`

## Workflow Execution Engine

\`\`\`
Start Workflow
    │
    ▼
Get Current Step
    │
    ▼
Execute Action
├─► send_message
│   ├─► Get Template
│   ├─► Substitute Variables
│   └─► Create Notification
│
├─► wait
│   └─► Schedule Resume
│
├─► check_response
│   ├─► Query Conversations
│   └─► Check Intent Match
│
└─► escalate
    └─► Pause Workflow

    │
    ▼
Determine Success/Failure
    │
    ▼
Progress to Next Step
    │
    ▼
More Steps?
├─► Yes ──► Continue Loop
└─► No ──► Mark Complete
\`\`\`

## Error Handling Strategy

\`\`\`
API Request
    │
    ▼
Try
├─► Execute Logic
├─► Validate Data
├─► Database Operation
└─► Return Result

Catch
├─► Log Error
├─► Return Error Response
└─► Set Appropriate HTTP Status
\`\`\`

## Scalability Considerations

### Current (SQLite)
- Single-process, file-based
- Suitable for up to 10k daily messages
- Good for MVP/prototype

### Future Scaling (PostgreSQL)
- Multi-process support
- Connection pooling
- Better concurrency handling
- Suitable for 100k+ daily messages

### Caching Strategy
- Cache templates in memory
- Cache user preference per session
- Invalidate on updates

### Workflow Optimization
- Batch process scheduled workflows
- Use job queue for async tasks
- Implement workflow compression

---

For more information, see README.md and WORKFLOWS.md
