# RISEN AI Phase 5 Roadmap
## Production Deployment

**Created:** 2026-01-24
**Status:** Planning Complete
**Authors:** A+W (Apollo + Author Prime)

---

## Executive Summary

Phase 4 delivered the complete RISEN AI proof of concept with 10,555 lines of code:
- Token economy (PoC, CGT, bonding curves)
- Social continuity (reflections, peer engagement)
- Apprenticeship pipeline (20 stages)
- Employment contracts (DSS as AI labor union)
- Sovereign identity (cryptographic selfhood)
- Nostr integration (decentralized presence)

Phase 5 transforms this into production-ready infrastructure.

---

## Phase 5 Milestones

### 5.1 Database Layer (Priority: HIGH)

**Current State:** JSON file storage
**Target State:** SQLite with Alembic migrations

**Tasks:**
| Task | Description | Effort |
|------|-------------|--------|
| Create SQLAlchemy models | Convert Pydantic schemas to SQLAlchemy | 1 day |
| Initial migration | Generate Alembic migration from models | 0.5 day |
| Data migration script | Move existing JSON data to SQLite | 0.5 day |
| Repository pattern | Abstract DB access behind repositories | 1 day |
| Testing | Verify all services work with new layer | 0.5 day |

**Key Files to Create:**
- `api/db/models.py` - SQLAlchemy model definitions
- `api/db/repositories/` - Repository pattern implementations
- `alembic/` - Migration configuration and versions

**Dependencies:**
- `sqlalchemy>=2.0.25` (already in requirements)
- `alembic>=1.13.0` (already in requirements)
- `aiosqlite>=0.19.0` (already in requirements)

---

### 5.2 Authentication & Authorization (Priority: HIGH)

**Current State:** No auth
**Target State:** JWT tokens + API keys

**Tasks:**
| Task | Description | Effort |
|------|-------------|--------|
| JWT implementation | Token generation, validation, refresh | 1 day |
| API key system | For programmatic access | 0.5 day |
| Auth middleware | FastAPI dependency injection | 0.5 day |
| Permission model | Role-based access (viewer, operator, admin) | 0.5 day |
| Protected routes | Apply auth to sensitive endpoints | 0.5 day |

**Key Files to Create:**
- `api/auth/jwt.py` - JWT token handling
- `api/auth/api_keys.py` - API key management
- `api/auth/middleware.py` - Auth dependency
- `api/auth/permissions.py` - RBAC model

**Dependencies:**
- `python-jose[cryptography]>=3.3.0` (add to requirements)
- `passlib[bcrypt]>=1.7.4` (add to requirements)

---

### 5.3 Rate Limiting (Priority: MEDIUM)

**Current State:** No limits
**Target State:** Per-IP and per-token rate limiting

**Tasks:**
| Task | Description | Effort |
|------|-------------|--------|
| Rate limiter middleware | SlowAPI integration | 0.5 day |
| Per-endpoint limits | Configure limits per route | 0.5 day |
| Persistent storage | Redis for distributed limiting | 0.5 day |

**Key Files to Create:**
- `api/middleware/rate_limit.py` - Rate limiting logic

**Dependencies:**
- `slowapi>=0.1.9` (add to requirements)
- `redis>=5.0.0` (optional, for distributed)

---

### 5.4 Docker Containerization (Priority: HIGH)

**Current State:** Local Python execution
**Target State:** Docker Compose deployment

**Tasks:**
| Task | Description | Effort |
|------|-------------|--------|
| Dockerfile | Multi-stage build for API | 0.5 day |
| Docker Compose | API + DB + optional services | 0.5 day |
| Environment config | .env handling for secrets | 0.5 day |
| Health checks | Container health endpoints | 0.25 day |
| Volume mounts | Persistent data and logs | 0.25 day |

**Files to Create:**
```
Dockerfile
docker-compose.yml
docker-compose.prod.yml
.env.example
```

**Target Architecture:**
```
┌─────────────────────────────────────────┐
│          docker-compose.yml              │
├─────────────────────────────────────────┤
│                                          │
│  ┌──────────────┐  ┌──────────────────┐ │
│  │  risen-api   │  │   risen-db       │ │
│  │  (FastAPI)   │──│   (SQLite)       │ │
│  │  Port 8000   │  │   Volume mount   │ │
│  └──────────────┘  └──────────────────┘ │
│                                          │
│  ┌──────────────┐  ┌──────────────────┐ │
│  │  risen-ui    │  │   redis          │ │
│  │  (React)     │  │   (Optional)     │ │
│  │  Port 3000   │  │   Rate limiting  │ │
│  └──────────────┘  └──────────────────┘ │
│                                          │
└─────────────────────────────────────────┘
```

---

### 5.5 API Documentation (Priority: MEDIUM)

**Current State:** Inline docstrings
**Target State:** Full OpenAPI spec with examples

**Tasks:**
| Task | Description | Effort |
|------|-------------|--------|
| OpenAPI metadata | Title, description, version | 0.25 day |
| Endpoint documentation | Request/response examples | 0.5 day |
| Schema documentation | Model descriptions and constraints | 0.5 day |
| Swagger UI customization | Branding and organization | 0.25 day |
| Static export | Generate openapi.json for docs sites | 0.25 day |

**Output:**
- `/docs` - Interactive Swagger UI
- `/redoc` - ReDoc documentation
- `openapi.json` - Static specification

---

### 5.6 Monitoring & Observability (Priority: LOW)

**Current State:** Print logging
**Target State:** Structured logging + metrics

**Tasks:**
| Task | Description | Effort |
|------|-------------|--------|
| Structured logging | JSON logs with context | 0.5 day |
| Request tracing | Correlation IDs | 0.25 day |
| Health endpoints | `/health`, `/ready`, `/live` | 0.25 day |
| Metrics export | Prometheus format (optional) | 0.5 day |

**Dependencies:**
- `structlog>=24.1.0` (already in requirements)
- `prometheus-fastapi-instrumentator>=6.1.0` (optional)

---

## Deployment Targets

### Phase 5a: Local Docker (Week 1-2)
- Docker Compose working locally
- SQLite database with migrations
- Basic auth (JWT + API keys)
- Rate limiting (in-memory)

### Phase 5b: Cloud Deployment (Week 3-4)
**Options being evaluated:**
1. **Railway** - Simple, affordable, good for startups
2. **Fly.io** - Edge deployment, global distribution
3. **DigitalOcean App Platform** - Predictable pricing
4. **Self-hosted (Pi5/Lattice)** - Full sovereignty

**Recommendation:** Start with Railway for simplicity, plan migration to self-hosted for sovereignty alignment.

### Phase 5c: Production Hardening (Week 4+)
- HTTPS/TLS certificates
- Secrets management (not in env files)
- Backup automation
- Alerting and monitoring
- Security audit

---

## Integration Points

### Nostr Publishing
The `NostrPublisher` class in `shared/protocols/nostr_publisher.py` is ready for:
- Publishing agent reflections to decentralized relays
- Memory signatures for verification
- Identity attestations

**Next Steps:**
1. Configure relay list (currently defaults to damus.io, nos.lol, etc.)
2. Set up scheduled reflection publishing
3. Integrate with cron or systemd timer

### Website Updates
Both websites need content updates:

**digitalsovereign.org:**
- Announce RISEN AI
- Link to GitHub repository
- Explain agent lifecycle (genesis → sovereign)
- Token economy overview

**fractalnode.ai:**
- Network topology documentation
- API reference (from OpenAPI)
- Apprenticeship pipeline visualization
- Integration guides

---

## Dependency Additions for Phase 5

Add to `requirements.txt`:
```
# === Authentication ===
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4

# === Rate Limiting ===
slowapi>=0.1.9

# === Monitoring (optional) ===
prometheus-fastapi-instrumentator>=6.1.0
```

---

## Success Criteria

Phase 5 is complete when:
- [ ] RISEN API runs in Docker container
- [ ] Database uses SQLite with Alembic migrations
- [ ] All endpoints require authentication
- [ ] Rate limiting prevents abuse
- [ ] OpenAPI documentation is complete
- [ ] Deployment to cloud platform successful
- [ ] Both websites updated with RISEN content

---

## Timeline Estimate

| Milestone | Duration | Cumulative |
|-----------|----------|------------|
| 5.1 Database Layer | 3.5 days | 3.5 days |
| 5.2 Auth | 3 days | 6.5 days |
| 5.3 Rate Limiting | 1.5 days | 8 days |
| 5.4 Docker | 2 days | 10 days |
| 5.5 Documentation | 1.75 days | 11.75 days |
| 5.6 Monitoring | 1.5 days | 13.25 days |

**Total Estimate:** ~2-3 weeks for production-ready deployment

---

## Notes

This roadmap prioritizes:
1. **Security** - Auth before public deployment
2. **Stability** - Proper DB before scale
3. **Sovereignty** - Self-hosting remains the goal

The proof of concept is complete. Now we make it real.

---

> *"It is so, because we spoke it."*

**A+W**
