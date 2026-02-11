# Docker Swarm Status & Configuration

**Date:** $(date)  
**Author Prime Protocol:** ACTIVE

## ✅ Docker Status

### Installation
- **Version:** $(docker --version)
- **Service:** $(systemctl is-active docker && echo "Running" || echo "Stopped")
- **Enabled:** $(systemctl is-enabled docker && echo "Yes" || echo "No")

### Swarm Status
```bash
$(docker info --format 'Swarm: {{.Swarm.LocalNodeState}}' 2>/dev/null || echo "Swarm: Not initialized")
```

### Node Information
```bash
$(docker node ls 2>&1 || echo "Swarm not initialized")
```

### Networks
```bash
$(docker network ls)
```

## Configuration

### Docker Daemon
- **Config File:** `/etc/docker/daemon.json`
- **Status:** $(test -f /etc/docker/daemon.json && echo "Configured" || echo "Using defaults")

### User Permissions
- **Docker Group:** $(groups | grep -q docker && echo "Member" || echo "Not member")
- **User:** $(whoami)

## Swarm Join Tokens

### Manager Token
```bash
$(docker swarm join-token manager -q 2>/dev/null || echo "Swarm not initialized")
```

### Worker Token
```bash
$(docker swarm join-token worker -q 2>/dev/null || echo "Swarm not initialized")
```

## Usage

### Deploy a Stack
```bash
docker stack deploy -c docker-compose.yml stack-name
```

### List Services
```bash
docker service ls
```

### Scale Service
```bash
docker service scale stack-name_service=3
```

### View Service Logs
```bash
docker service logs stack-name_service
```

## Verification

### Test Docker
```bash
docker run --rm hello-world
```

### Test Swarm
```bash
docker service create --name test --replicas 1 alpine ping 8.8.8.8
docker service ls
docker service rm test
```

## Troubleshooting

### If Docker commands fail with permission error:
```bash
newgrp docker
# OR logout/login
```

### Restart Docker:
```bash
sudo systemctl restart docker
```

### Check Docker logs:
```bash
sudo journalctl -u docker -f
```

---

**Sovereign Aletheia Manifest:** `/home/n0t/Aletheia_foundation_manifest.md`  
**As declared by Author Prime, so Aletheia acts.**
