# 🚀 Serenity App - Production Deployment Guide

## Prerequisites

- Linux server (Ubuntu 22.04 LTS recommended)
- Docker & Docker Compose installed
- Domain name with DNS configured
- SSL certificate (Let's Encrypt recommended)
- Minimum 4GB RAM, 2 CPU cores, 40GB storage

## Quick Start

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Install essential tools
sudo apt install git nginx certbot python3-certbot-nginx -y
```

### 2. Clone Repository

```bash
# Create app directory
sudo mkdir -p /app
sudo chown $USER:$USER /app
cd /app

# Clone repository
git clone https://github.com/yourusername/serenity-app.git
cd serenity-app
```

### 3. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

**Required configurations:**
- Set strong passwords for POSTGRES_PASSWORD and REDIS_PASSWORD
- Generate secure JWT secrets (min 32 characters)
- Configure email service (SendGrid)
- Set up Stripe keys
- Configure AWS S3 credentials
- Update domain URLs

**Generate secure secrets:**
```bash
# Generate JWT secrets
openssl rand -base64 32
openssl rand -base64 32
```

### 4. SSL Certificate Setup

```bash
# Install Let's Encrypt certificate
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com

# Auto-renewal setup (already configured)
sudo certbot renew --dry-run
```

### 5. Database Initialization

```bash
# Start only database first
docker-compose -f docker-compose.prod.yml up -d postgres redis

# Wait for services to be healthy
sleep 10

# Run database migrations
docker-compose -f docker-compose.prod.yml run --rm backend npx prisma migrate deploy

# Optional: Seed database
docker-compose -f docker-compose.prod.yml run --rm backend npm run prisma:seed
```

### 6. Build and Deploy

```bash
# Build and start all services
docker-compose -f docker-compose.prod.yml up -d --build

# Check service status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 7. Verify Deployment

```bash
# Check backend health
curl https://api.yourdomain.com/health

# Check frontend
curl https://yourdomain.com

# Check database connection
docker-compose -f docker-compose.prod.yml exec backend npx prisma db pull
```

## Service URLs

- **Frontend:** https://yourdomain.com
- **Backend API:** https://api.yourdomain.com
- **Health Check:** https://api.yourdomain.com/health
- **Database:** Internal (postgres:5432)
- **Redis:** Internal (redis:6379)

## Monitoring & Maintenance

### View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f postgres
```

### Database Backup

```bash
# Create backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U serenity serenity > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
cat backup_YYYYMMDD_HHMMSS.sql | docker-compose -f docker-compose.prod.yml exec -T postgres psql -U serenity serenity
```

### Update Application

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart services
docker-compose -f docker-compose.prod.yml up -d --build

# Run new migrations
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

### Scale Services

```bash
# Scale backend horizontally
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# Scale with load balancing (update nginx.conf first)
docker-compose -f docker-compose.prod.yml restart nginx
```

## Performance Optimization

### 1. Enable Redis Caching

Already configured in the application. Verify:
```bash
docker-compose -f docker-compose.prod.yml exec redis redis-cli ping
# Should return: PONG
```

### 2. Database Optimization

```bash
# Connect to database
docker-compose -f docker-compose.prod.yml exec postgres psql -U serenity

# Run vacuum
VACUUM ANALYZE;

# Check indexes
\di
```

### 3. Monitor Resource Usage

```bash
# Container stats
docker stats

# Disk usage
docker system df
docker volume ls
```

### 4. Clean Up

```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Complete cleanup
docker system prune -a --volumes
```

## Security Checklist

- ✅ Strong passwords for all services
- ✅ JWT secrets are randomly generated
- ✅ HTTPS/SSL enabled
- ✅ Firewall configured (UFW)
- ✅ Rate limiting enabled
- ✅ Security headers configured
- ✅ Database not exposed to public
- ✅ Environment variables secured
- ✅ Regular backups scheduled
- ✅ Docker containers run as non-root

### Firewall Configuration

```bash
# Install UFW
sudo apt install ufw

# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs [service-name]

# Restart service
docker-compose -f docker-compose.prod.yml restart [service-name]

# Rebuild service
docker-compose -f docker-compose.prod.yml up -d --build [service-name]
```

### Database Connection Issues

```bash
# Check database is running
docker-compose -f docker-compose.prod.yml ps postgres

# Test connection
docker-compose -f docker-compose.prod.yml exec postgres psql -U serenity -c "SELECT 1"

# Check DATABASE_URL
docker-compose -f docker-compose.prod.yml exec backend printenv DATABASE_URL
```

### Memory Issues

```bash
# Check memory usage
free -h
docker stats

# Limit container memory (in docker-compose.prod.yml)
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 1G
```

### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run
```

## CI/CD Setup

### GitHub Actions

Secrets required in GitHub repository settings:
- `DEPLOY_HOST`: Server IP/domain
- `DEPLOY_USER`: SSH username
- `DEPLOY_KEY`: SSH private key
- `SLACK_WEBHOOK`: (Optional) Slack notifications

### Automatic Deployment

Push to `main` branch triggers:
1. Run tests
2. Build Docker images
3. Push to registry
4. Deploy to production
5. Send notifications

## Support & Maintenance

### Regular Tasks

**Daily:**
- Monitor application logs
- Check error rates
- Verify backups

**Weekly:**
- Update dependencies
- Review security alerts
- Analyze performance metrics

**Monthly:**
- Update system packages
- Review and rotate SSL certificates
- Database optimization
- Clean up old logs and backups

### Monitoring Tools (Recommended)

- **Application Monitoring:** Sentry, New Relic
- **Infrastructure:** Prometheus + Grafana
- **Logs:** ELK Stack (Elasticsearch, Logstash, Kibana)
- **Uptime:** UptimeRobot, Pingdom

## Cost Optimization

### Recommended Infrastructure

**Starter (Small traffic):**
- DigitalOcean Droplet: $24/month (4GB RAM, 2 vCPUs)
- Managed PostgreSQL: $15/month
- Redis: Included in app
- Total: ~$40/month

**Growth (Medium traffic):**
- AWS EC2 t3.medium: $30/month
- RDS PostgreSQL: $25/month
- ElastiCache Redis: $13/month
- S3 + CloudFront: ~$10/month
- Total: ~$80/month

**Scale (High traffic):**
- AWS ECS/EKS with auto-scaling
- RDS Multi-AZ
- ElastiCache cluster
- CloudFront CDN
- Total: $200-500/month

## Next Steps

1. ✅ Deploy to production
2. Configure monitoring
3. Set up automated backups
4. Implement CI/CD
5. Configure custom domain
6. Set up email service
7. Configure payment gateway
8. Load test application
9. Security audit
10. Documentation for team

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Docker Documentation](https://docs.docker.com)
- [PostgreSQL Best Practices](https://wiki.postgresql.org/wiki/Main_Page)
- [Stripe Integration Guide](https://stripe.com/docs)

---

**Need help?** Open an issue on GitHub or contact support@serenity.app
