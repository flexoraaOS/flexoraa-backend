# AWS EKS Migration Blueprint (Future Scale)

**When to migrate:** >5,000 req/sec sustained, >100 GB data, multi-region needs

---

## Target Architecture

### AWS EKS Cluster
- **Node Type:** t3.medium (2 vCPU, 4 GB RAM)
- **Node Count:** 3-10 (auto-scaling)
- **Region:** us-east-1 (primary), eu-central-1 (DR)

### Database
- **AWS RDS PostgreSQL:** db.t3.medium (2 vCPU, 4 GB RAM)
- **Multi-AZ:** Yes
- **Read Replicas:** 1-2

### Storage
- **AWS S3:** General Purpose
- **AWS EFS:** For shared volumes (if needed)

### Networking
- **AWS ALB:** Application Load Balancer
- **AWS NAT Gateway:** For outbound traffic
- **AWS VPC:** Private subnets for workers

---

## Migration Steps

### Phase 1: Preparation (Week 1-2)
1. Create AWS account and set up billing alerts
2. Provision EKS cluster with Terraform/CDK
3. Set up RDS PostgreSQL instance
4. Migrate Supabase data to RDS
5. Configure S3 buckets for backups

### Phase 2: Infrastructure (Week 3-4)
1. Convert Docker Compose to Kubernetes manifests
2. Set up AWS ALB Ingress Controller
3. Configure autoscaling (HPA + Cluster Autoscaler)
4. Set up AWS CloudWatch for monitoring
5. Configure AWS Secrets Manager

### Phase 3: Testing (Week 5)
1. Deploy to staging EKS cluster
2. Run load tests (k6 with 10K rps target)
3. Chaos testing with AWS Fault Injection Simulator
4. Performance tuning

### Phase 4: Migration (Week 6)
1. DNS cutover with Route 53
2. Blue-green deployment
3. Monitor for 48 hours
4. Decommission Hetzner infrastructure

---

## Cost Comparison

### Hetzner (Current)
| Resource | Monthly Cost |
|----------|-------------|
| CX22 VM | €5.83 |
| Block Storage | €4.00 |
| Object Storage | €2.50 |
| **Total** | **€12.33** |

### AWS EKS (Estimated)
| Resource | Monthly Cost |
|----------|-------------|
| EKS Control Plane | $72 |
| EC2 t3.medium (3 nodes) | $90 |
| RDS db.t3.medium | $60 |
| ALB | $20 |
| NAT Gateway | $32 |
| S3 (100 GB) | $2.30 |
| Data Transfer | $50 |
| **Total** | **~$326 (€300)** |

**Cost Increase:** ~25x  
**Justification:** Needed for >5K rps, multi-region, HA requirements

---

## Kubernetes Manifests (Example)

### Spike Absorber Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: spike-absorber
  namespace: production
spec:
  replicas: 5
  selector:
    matchLabels:
      app: spike-absorber
  template:
    metadata:
      labels:
        app: spike-absorber
    spec:
      containers:
      - name: absorber
        image: your-ecr-repo/spike-absorber:latest
        ports:
        - containerPort: 8080
        env:
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-credentials
              key: url
        - name: DB_URL
          valueFrom:
            secretKeyRef:
              name: rds-credentials
              key: url
        resources:
          requests:
            cpu: "200m"
            memory: "256Mi"
          limits:
            cpu: "500m"
            memory: "512Mi"
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: spike-absorber-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: spike-absorber
  minReplicas: 5
  maxReplicas: 50
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

---

## AWS-Specific Optimizations

### 1. Use AWS ElastiCache (Redis)
```
elasticache.t3.medium
- 2 vCPU, 3.09 GB RAM
- Multi-AZ with automatic failover
- Cost: ~$60/month
```

### 2. Use AWS SQS + EventBridge
```
Replace Redis queues with:
- SQS FIFO for Critical queue
- SQS Standard for Normal/Low queues
- EventBridge for event routing
```

### 3. Use AWS Lambda for Workers
```
Replace Worker A with Lambda:
- On-demand scaling
- Pay per invocation
- Cost savings for bursty workloads
```

---

## Terraform Template (Starter)

```hcl
# eks-cluster.tf
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 19.0"

  cluster_name    = "flexoraa-production"
  cluster_version = "1.28"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  eks_managed_node_groups = {
    workers = {
      min_size     = 3
      max_size     = 10
      desired_size = 3

      instance_types = ["t3.medium"]
      
      labels = {
        role = "worker"
      }
    }
  }
}

# rds.tf
resource "aws_db_instance" "postgres" {
  identifier           = "flexoraa-db"
  engine               = "postgres"
  engine_version       = "15.4"
  instance_class       = "db.t3.medium"
  allocated_storage    = 100
  storage_encrypted    = true
  
  db_name  = "flexoraa"
  username = "flexoraa_user"
  password = var.db_password

  multi_az               = true
  backup_retention_period = 7
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
}
```

---

## Decision Matrix

| Criteria | Hetzner (Current) | AWS EKS (Future) |
|----------|-------------------|------------------|
| Cost | €12/month | €300/month |
| Max Capacity | 1K rps | 50K+ rps |
| Scaling | Manual | Auto |
| Multi-Region | No | Yes |
| Managed Services | Limited | Extensive |
| DDoS Protection | Basic | AWS Shield |
| Compliance | GDPR | GDPR + SOC2 |

**Recommendation:** Stay on Hetzner until consistent >2K rps or revenue >$10K/month

---

## Migration Checklist

- [ ] Create AWS account
- [ ] Set up Terraform/CDK infrastructure
- [ ] Provision EKS cluster
- [ ] Set up RDS PostgreSQL
- [ ] Migrate database from Supabase to RDS
- [ ] Convert Docker Compose to K8s manifests
- [ ] Set up CI/CD with GitHub Actions + ECR
- [ ] Configure AWS ALB + Route 53
- [ ] Set up CloudWatch monitoring
- [ ] Run load tests on staging
- [ ] Blue-green deployment to production
- [ ] Monitor for 1 week
- [ ] Decommission Hetzner

---

**Status:** Blueprint ready. Execute when growth metrics justify migration.
