# Software-14 Platform Documentation

## Overview

**Software-14** is an interactive social and academic platform designed for the 14th batch of Software Engineering students at Sudan University of Science and Technology. The platform combines community features, academic resources, gaming, and AI-powered assistance in a unified interface.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Core Features](#core-features)
4. [Database Schema](#database-schema)
5. [Authentication & Authorization](#authentication--authorization)
6. [API Reference](#api-reference)
7. [Frontend Components](#frontend-components)
8. [State Management](#state-management)
9. [Configuration](#configuration)
10. [Development & Deployment](#development--deployment)

---

## Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Charts**: Recharts

### Backend
- **Runtime**: Node.js with Bun
- **Database ORM**: Prisma
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js v4
- **AI Integration**: Google Generative AI (Gemini)

### UI Components
- **Component Library**: Radix UI primitives
- **Custom Components**: shadcn/ui-based components
- **Drag & Drop**: @dnd-kit
- **Forms**: React Hook Form + Zod validation

### State Management
- **Global State**: Zustand

---

## Project Structure

```
/workspace
├── prisma/
│   └── schema.prisma          # Database schema definition
├── public/                     # Static assets
├── src/
│   ├── app/
│   │   ├── (dashboard)/       # Protected dashboard pages
│   │   │   ├── academic/      # Academic resources page
│   │   │   ├── admin/         # Admin panel
│   │   │   ├── ai/            # AI chat interface
│   │   │   ├── dashboard/     # Main dashboard
│   │   │   ├── gallery/       # Photo gallery
│   │   │   ├── games/         # Games section
│   │   │   ├── memories/      # Memories feed
│   │   │   ├── news/          # News & events
│   │   │   ├── settings/      # User settings
│   │   │   └── layout.tsx     # Dashboard layout with sidebar
│   │   ├── api/               # API routes
│   │   │   ├── academic/      # Academic resources API
│   │   │   ├── albums/        # Photo albums API
│   │   │   ├── auth/          # Authentication endpoints
│   │   │   ├── chat/          # AI chat endpoint
│   │   │   ├── discussions/   # Forum discussions API
│   │   │   ├── games/         # Game-related APIs
│   │   │   ├── honor/         # Honor roll API
│   │   │   ├── memories/      # Memories CRUD API
│   │   │   ├── news/          # News events API
│   │   │   ├── quiz/          # Quiz API
│   │   │   ├── reports/       # Content reporting API
│   │   │   ├── theme/         # Theme configuration API
│   │   │   ├── users/         # User management API
│   │   │   └── votes/         # Voting system API
│   │   ├── auth/              # Auth pages (login/register)
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Landing page
│   ├── components/
│   │   ├── games/             # Game components (Chess, Tic-Tac-Toe, Memory)
│   │   ├── providers/         # Context providers (Auth, Theme)
│   │   ├── sections/          # Page sections
│   │   ├── shared/            # Shared components (Header, Sidebar, AI Widget)
│   │   ├── themes/            # Theme management components
│   │   └── ui/                # Reusable UI components (shadcn)
│   ├── hooks/                 # Custom React hooks
│   │   ├── use-chat.ts        # Chat functionality hook
│   │   ├── use-mobile.ts      # Mobile detection hook
│   │   └── use-toast.ts       # Toast notifications hook
│   ├── lib/                   # Utility libraries
│   │   ├── auth.ts            # NextAuth configuration
│   │   ├── db.ts              # Prisma client instance
│   │   └── utils.ts           # General utilities
│   └── stores/                # Zustand stores
│       └── app-store.ts       # Global application state
├── tailwind.config.ts         # Tailwind configuration
├── next.config.ts             # Next.js configuration
├── tsconfig.json              # TypeScript configuration
├── package.json               # Dependencies & scripts
└── eslint.config.mjs          # ESLint configuration
```

---

## Core Features

### 1. Memories (الذكريات)
A social feed where users can share text posts with optional images.
- Create, read, update, delete memories
- Word limit: 1000 words per post
- Displays author information with role badges

### 2. Gallery (المعرض)
Photo album system for organizing and sharing images.
- Create albums
- Upload photos to albums
- Add captions to photos

### 3. Academic Resources (الأكاديمي)
Resource sharing platform for professors and students.
- Professors can upload PDFs, links, and videos
- Categorized resources
- Discussion forums for academic topics

### 4. News & Events (الأخبار والفعاليات)
Announcement system for batch news and events.
- Categories: exam, event, general, announcement
- Pinned important announcements
- Author attribution

### 5. Games (الألعاب)
AI-powered gaming section with score tracking.
- **Chess**: Play chess with AI opponent
- **Tic-Tac-Toe**: Classic game with AI
- **Memory Match**: Card matching game
- **AI Quiz**: Interactive quiz powered by AI
- Leaderboard with weekly scores

### 6. AI Chat Assistant (المحادثة الذكية)
Intelligent chatbot integrated with Google Gemini AI.
- Context-aware responses (platform info vs general knowledge)
- Rate limiting: 20 requests per minute per IP
- Conversation history support
- Arabic language optimized
- System prompts for platform-specific and general queries

### 7. Honor Roll (لوحة الشرف)
Weekly recognition system for outstanding students.
- Categories: Academic, Gaming, Voting
- Weekly and yearly tracking
- Public leaderboard

### 8. Admin Panel (الإدارة)
Moderation and management tools for admins.
- User role management
- Content moderation
- Report handling
- Audit logging

### 9. Voting System
Peer recognition voting mechanism.
- One vote per category per week per user
- Categories: academic, gaming, general
- Contributes to honor roll

### 10. Reporting System
Content and user reporting for community safety.
- Report memories, photos, or users
- Status tracking: pending, resolved, dismissed
- Admin review workflow

---

## Database Schema

### Models

#### User
```prisma
User {
  id: String (UUID)
  email: String (unique)
  name: String
  password: String? (bcrypt hashed)
  role: String (admin|moderator|professor|student|visitor)
  avatar: String?
  points: Int (default: 0)
  bio: String?
  themePref: String?
  emailVerified: DateTime?
  provider: String (credentials|google)
  createdAt: DateTime
  updatedAt: DateTime
  
  // Relations
  memories: Memory[]
  photos: Photo[]
  albums: Album[]
  discussions: Discussion[]
  comments: Comment[]
  votesCast: Vote[]
  votesReceived: Vote[]
  gameScores: GameScore[]
  resources: Resource[]
  newsEvents: NewsEvent[]
  reportsMade: Report[]
  reportsReceived: Report[]
  auditLogs: AuditLog[]
}
```

#### Memory
```prisma
Memory {
  id: String (UUID)
  userId: String (FK -> User)
  text: String
  imageUrl: String?
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### Album & Photo
```prisma
Album {
  id: String (UUID)
  title: String
  createdBy: String (FK -> User)
  createdAt: DateTime
  updatedAt: DateTime
  
  photos: Photo[]
}

Photo {
  id: String (UUID)
  albumId: String (FK -> Album)
  userId: String (FK -> User)
  url: String
  caption: String?
  createdAt: DateTime
}
```

#### Resource (Academic)
```prisma
Resource {
  id: String (UUID)
  profId: String (FK -> User)
  title: String
  fileUrl: String?
  link: String?
  type: String (pdf|link|video)
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### Discussion & Comment
```prisma
Discussion {
  id: String (UUID)
  userId: String (FK -> User)
  title: String
  content: String
  pinned: Boolean (default: false)
  createdAt: DateTime
  updatedAt: DateTime
  
  comments: Comment[]
}

Comment {
  id: String (UUID)
  discussionId: String (FK -> Discussion)
  userId: String (FK -> User)
  content: String
  parentId: String? (self-relation for replies)
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### NewsEvent
```prisma
NewsEvent {
  id: String (UUID)
  authorId: String (FK -> User)
  title: String
  content: String
  category: String (general|exam|event|announcement)
  pinned: Boolean (default: false)
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### Vote
```prisma
Vote {
  id: String (UUID)
  voterId: String (FK -> User)
  candidateId: String (FK -> User)
  category: String (academic|gaming|general)
  week: Int
  createdAt: DateTime
  
  @@unique([voterId, category, week])
}
```

#### GameScore
```prisma
GameScore {
  id: String (UUID)
  userId: String (FK -> User)
  game: String (xo|memory|chess|quiz)
  score: Int
  createdAt: DateTime
}
```

#### HonorEntry
```prisma
HonorEntry {
  id: String (UUID)
  userId: String
  category: String (academic|gaming|voting)
  week: Int
  year: Int
  createdAt: DateTime
  
  @@unique([category, week, year])
}
```

#### Report
```prisma
Report {
  id: String (UUID)
  reporterId: String (FK -> User)
  reportedId: String (FK -> User)
  reason: String
  targetType: String (memory|photo|user)
  targetId: String
  status: String (pending|resolved|dismissed)
  createdAt: DateTime
}
```

#### ThemeConfig & SiteSetting
```prisma
ThemeConfig {
  id: String (UUID)
  key: String (unique)
  value: String
  updatedAt: DateTime
}

SiteSetting {
  id: String (UUID)
  key: String (unique)
  value: String
  updatedAt: DateTime
}
```

#### AuditLog
```prisma
AuditLog {
  id: String (UUID)
  actorId: String (FK -> User)
  action: String
  targetType: String (memory|photo|user|report)
  targetId: String
  details: String?
  createdAt: DateTime
}
```

---

## Authentication & Authorization

### Providers
1. **Credentials**: Email/password authentication with bcrypt hashing
2. **Google OAuth**: Single sign-on with Google accounts

### User Roles
- **Admin**: Full system access, user management, content moderation
- **Moderator**: Content moderation, report handling
- **Professor**: Academic resource management
- **Student**: Standard user access
- **Visitor**: Limited read-only access

### Session Management
- Strategy: JWT-based sessions
- Session duration: 30 days
- Token includes: id, role, avatar, points, bio, themePref

### Protected Routes
- All `/dashboard/*` routes require authentication
- `/admin/*` routes require admin or moderator role
- API routes validate session tokens

---

## API Reference

### Base URL
All API endpoints are prefixed with `/api`

### Endpoints

#### Memories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/memories` | Fetch all memories |
| POST | `/api/memories` | Create new memory |

#### Albums & Photos
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/albums` | List all albums |
| POST | `/api/albums` | Create album |
| GET | `/api/albums/[id]/photos` | Get album photos |
| POST | `/api/albums/[id]/photos` | Upload photo |

#### Academic Resources
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/academic` | Get all resources |
| POST | `/api/academic` | Create resource |

#### News & Events
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/news` | Fetch news events |
| POST | `/api/news` | Create news item |

#### Discussions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/discussions` | List discussions |
| POST | `/api/discussions` | Create discussion |
| GET | `/api/discussions/[id]/comments` | Get comments |
| POST | `/api/discussions/[id]/comments` | Add comment |

#### Games
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/games/chess` | Chess move validation |
| POST | `/api/games/tictactoe` | Tic-tac-toe game logic |
| POST | `/api/games/score` | Submit game score |

#### AI Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Send message to AI |

**Request Body:**
```json
{
  "message": "string",
  "context": "platform" | "general",
  "history": [{ "role": "user|assistant", "content": "string" }]
}
```

**Response:**
```json
{
  "response": "string"
}
```

#### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users |
| GET | `/api/users/[id]` | Get user profile |
| PUT | `/api/users/[id]` | Update user |
| DELETE | `/api/users/[id]` | Delete user |
| PUT | `/api/users/[id]/role` | Change user role (admin only) |

#### Votes
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/votes` | Cast a vote |
| GET | `/api/votes` | Get vote results |

#### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports` | List reports (admin) |
| POST | `/api/reports` | Submit report |
| PUT | `/api/reports/[id]` | Update report status |

#### Honor Roll
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/honor` | Get honor roll entries |

#### Theme
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/theme` | Get theme config |
| PUT | `/api/theme` | Update theme |

#### Quiz
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/quiz` | Generate quiz questions |

---

## Frontend Components

### Layout Components
- **DashboardLayout**: Main authenticated layout with sidebar navigation
- **Header**: Top navigation bar with user menu
- **SidebarNav**: Side navigation with role-based links
- **MobileBottomNav**: Bottom navigation for mobile devices

### Page Components
- **LandingPage**: Public homepage with feature showcase
- **LoginPage**: Credential login form
- **RegisterPage**: New user registration
- **DashboardPage**: User overview with stats
- **MemoriesPage**: Social feed interface
- **GalleryPage**: Photo album viewer
- **AcademicPage**: Resource browser
- **NewsPage**: News feed
- **GamesPage**: Game selection and play area
- **AIPage**: Chat interface
- **AdminPage**: Administration panel
- **SettingsPage**: User preferences

### Game Components
- **ChessGame**: Chess board with AI opponent
- **TicTacToe**: Tic-tac-toe game
- **MemoryMatch**: Card matching game
- **AIQuiz**: Interactive quiz component

### UI Components (shadcn/ui)
Complete set of accessible UI primitives:
- Forms: Input, Label, Select, Checkbox, Radio, Switch, Textarea
- Overlays: Dialog, Sheet, Drawer, Popover, DropdownMenu, ContextMenu
- Navigation: Breadcrumb, Pagination, Tabs, Accordion, Collapsible
- Data Display: Table, Card, Badge, Avatar, Progress, Skeleton
- Feedback: Toast, Alert, AlertDialog, Sonner
- Buttons: Button, Toggle, ToggleGroup
- Others: Slider, ScrollArea, Resizable, Command, Carousel

### Shared Components
- **AIChatWidget**: Floating AI chat assistant
- **ThemeProvider**: Dark/light mode toggle
- **AuthProvider**: Session provider wrapper
- **ThemeManager**: Advanced theme customization

---

## State Management

### Zustand Store (`app-store.ts`)

```typescript
interface AppState {
  // Navigation
  activeSection: string;
  setActiveSection: (section: string) => void;

  // Authentication
  currentUser: CurrentUser | null;
  setCurrentUser: (user: CurrentUser | null) => void;

  // UI State
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  // AI Chat
  aiChatOpen: boolean;
  setAiChatOpen: (open: boolean) => void;
}
```

### Custom Hooks
- **use-toast**: Toast notification management
- **use-mobile**: Responsive breakpoint detection
- **use-chat**: Chat state and message handling

---

## Configuration

### Environment Variables
```bash
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
AI_API_KEY="..."  # Google Generative AI key
```

### Key Configuration Files

#### `next.config.ts`
- Standalone build output for Docker deployment
- Asset optimization settings

#### `tailwind.config.ts`
- Custom color palette
- Animation configurations
- Font family setup (Cairo for Arabic)

#### `tsconfig.json`
- Path aliases: `@/*` → `./src/*`
- Strict TypeScript settings

#### `prisma/schema.prisma`
- Database provider: PostgreSQL
- All model definitions and relations

---

## Development & Deployment

### Prerequisites
- Node.js 18+ or Bun 1.3+
- PostgreSQL database
- Google Cloud credentials (for OAuth and AI)

### Installation
```bash
# Install dependencies
npm install
# or
bun install

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# (Optional) Seed database
npm run db:seed
```

### Development
```bash
# Start development server
npm run dev
# Access at http://localhost:3000
```

### Build & Production
```bash
# Build for production
npm run build

# Start production server
npm start
```

### Database Commands
```bash
# Push schema changes
npm run db:push

# Run migrations
npm run db:migrate

# Reset database
npm run db:reset

# Generate Prisma client
npm run db:generate

# Seed database
npm run db:seed
```

### Linting
```bash
npm run lint
```

### Docker Deployment
The build process creates a standalone output in `.next/standalone/` which can be used with a minimal Docker image.

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

---

## Security Considerations

1. **Password Hashing**: bcryptjs for secure password storage
2. **Rate Limiting**: AI chat endpoint limited to 20 requests/minute/IP
3. **Input Validation**: Zod schemas for form validation
4. **Authorization**: Role-based access control on API routes
5. **CSRF Protection**: NextAuth built-in CSRF tokens
6. **SQL Injection Prevention**: Prisma ORM parameterized queries

---

## Accessibility

- RTL (Right-to-Left) support for Arabic language
- ARIA labels on interactive elements
- Keyboard navigation support
- High contrast mode via theme switching
- Screen reader compatible components (Radix UI primitives)

---

## Performance Optimizations

- **Image Optimization**: Next.js Image component
- **Code Splitting**: Automatic via Next.js App Router
- **Server Components**: Reduced client-side JavaScript
- **Caching**: React Query for API data caching
- **Lazy Loading**: Dynamic imports for heavy components

---

## Future Enhancements

- Real-time notifications with WebSockets
- Advanced analytics dashboard
- Mobile app (React Native)
- Multi-language support beyond Arabic
- Enhanced gamification with achievements
- Video conferencing integration
- File storage with cloud providers (AWS S3, Cloudinary)

---

## Support & Contact

For issues or questions, contact the Software-14 development team through the platform's reporting system or admin panel.

---

*Last Updated: August 2025*
*Version: 0.2.0*
