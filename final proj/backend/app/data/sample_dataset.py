"""
Built-in sample dependency ecosystem for DependLock.
Structure: applications -> services -> packages -> (transitive) packages
"""

APPLICATIONS = [
    {"id": "app-auth-portal",   "name": "Auth Portal",        "criticality": "critical"},
    {"id": "app-payments",      "name": "Payments App",       "criticality": "critical"},
    {"id": "app-checkout",      "name": "Checkout Web",       "criticality": "critical"},
    {"id": "app-admin",         "name": "Admin Console",      "criticality": "critical"},
    {"id": "app-mobile",        "name": "Mobile App",         "criticality": "critical"},
    {"id": "app-analytics",     "name": "Analytics Platform", "criticality": "standard"},
    {"id": "app-support",       "name": "Support Portal",     "criticality": "standard"},
    {"id": "app-marketing",     "name": "Marketing Site",     "criticality": "standard"},
    {"id": "app-partner-api",   "name": "Partner API Gateway","criticality": "critical"},
    {"id": "app-internal-tools","name": "Internal Tools",     "criticality": "standard"},
]

SERVICES = [
    {"id": "svc-auth",        "name": "Authentication Service"},
    {"id": "svc-user",        "name": "User Service"},
    {"id": "svc-payment",     "name": "Payment Service"},
    {"id": "svc-billing",     "name": "Billing Service"},
    {"id": "svc-notification","name": "Notification Service"},
    {"id": "svc-session",     "name": "Session Manager"},
    {"id": "svc-analytics",   "name": "Analytics Engine"},
    {"id": "svc-reporting",   "name": "Reporting Service"},
    {"id": "svc-search",      "name": "Search Service"},
    {"id": "svc-gateway",     "name": "API Gateway"},
    {"id": "svc-audit",       "name": "Audit Logging Service"},
    {"id": "svc-inventory",   "name": "Inventory Service"},
    {"id": "svc-recommend",   "name": "Recommendation Engine"},
    {"id": "svc-media",       "name": "Media Processing Service"},
    {"id": "svc-config",      "name": "Config Service"},
    {"id": "svc-admin-api",   "name": "Admin API"},
]

# severity: 0-10, replaceability: low/medium/high (low = hard to replace = worse)
PACKAGES = [
    {"id": "pkg-crypto-lib",      "name": "crypto-lib",      "version": "2.3.1", "severity": 6, "replaceability": "low"},
    {"id": "pkg-utility-lib",     "name": "utility-lib",     "version": "4.0.0", "severity": 4, "replaceability": "medium"},
    {"id": "pkg-auth-lib",        "name": "auth-lib",        "version": "1.9.2", "severity": 7, "replaceability": "low"},
    {"id": "pkg-http-client",     "name": "http-client",     "version": "3.1.0", "severity": 5, "replaceability": "medium"},
    {"id": "pkg-json-parser",     "name": "json-parser",     "version": "1.2.4", "severity": 3, "replaceability": "high"},
    {"id": "pkg-logging-lib",     "name": "logging-lib",     "version": "2.0.1", "severity": 2, "replaceability": "high"},
    {"id": "pkg-date-utils",      "name": "date-utils",      "version": "1.0.5", "severity": 2, "replaceability": "high"},
    {"id": "pkg-orm-core",        "name": "orm-core",        "version": "5.2.0", "severity": 6, "replaceability": "low"},
    {"id": "pkg-cache-client",    "name": "cache-client",    "version": "2.1.0", "severity": 4, "replaceability": "medium"},
    {"id": "pkg-token-lib",       "name": "token-lib",       "version": "1.4.0", "severity": 8, "replaceability": "low"},
    {"id": "pkg-validator",       "name": "validator",       "version": "3.3.3", "severity": 3, "replaceability": "high"},
    {"id": "pkg-queue-client",    "name": "queue-client",    "version": "1.1.1", "severity": 5, "replaceability": "medium"},
    {"id": "pkg-serializer",      "name": "serializer",      "version": "2.5.0", "severity": 3, "replaceability": "high"},
    {"id": "pkg-config-loader",   "name": "config-loader",   "version": "1.0.9", "severity": 2, "replaceability": "high"},
    {"id": "pkg-hash-lib",        "name": "hash-lib",        "version": "1.6.0", "severity": 7, "replaceability": "low"},
    {"id": "pkg-template-engine", "name": "template-engine", "version": "4.1.2", "severity": 3, "replaceability": "medium"},
    {"id": "pkg-image-processor", "name": "image-processor", "version": "2.2.0", "severity": 5, "replaceability": "medium"},
    {"id": "pkg-search-index",    "name": "search-index",    "version": "3.0.1", "severity": 4, "replaceability": "medium"},
    {"id": "pkg-retry-lib",       "name": "retry-lib",       "version": "1.3.0", "severity": 2, "replaceability": "high"},
    {"id": "pkg-metrics-lib",     "name": "metrics-lib",     "version": "2.0.0", "severity": 3, "replaceability": "high"},
    {"id": "pkg-encoding-lib",    "name": "encoding-lib",    "version": "1.1.0", "severity": 4, "replaceability": "high"},
    {"id": "pkg-ssl-lib",         "name": "ssl-lib",         "version": "3.4.0", "severity": 8, "replaceability": "low"},
    {"id": "pkg-jwt-lib",         "name": "jwt-lib",         "version": "2.0.3", "severity": 7, "replaceability": "low"},
    {"id": "pkg-rate-limiter",    "name": "rate-limiter",    "version": "1.5.0", "severity": 3, "replaceability": "medium"},
    {"id": "pkg-file-storage",    "name": "file-storage",    "version": "2.8.0", "severity": 4, "replaceability": "medium"},
    {"id": "pkg-email-client",    "name": "email-client",    "version": "1.7.0", "severity": 3, "replaceability": "medium"},
    {"id": "pkg-sms-client",      "name": "sms-client",      "version": "1.2.0", "severity": 3, "replaceability": "medium"},
    {"id": "pkg-graphql-core",    "name": "graphql-core",    "version": "3.0.0", "severity": 4, "replaceability": "medium"},
    {"id": "pkg-schema-lib",      "name": "schema-lib",      "version": "1.9.0", "severity": 2, "replaceability": "high"},
    {"id": "pkg-compression-lib", "name": "compression-lib", "version": "1.0.2", "severity": 3, "replaceability": "high"},
    {"id": "pkg-uuid-lib",        "name": "uuid-lib",        "version": "1.0.0", "severity": 1, "replaceability": "high"},
    {"id": "pkg-i18n-lib",        "name": "i18n-lib",        "version": "2.3.0", "severity": 2, "replaceability": "high"},
    {"id": "pkg-pdf-generator",   "name": "pdf-generator",   "version": "3.1.0", "severity": 4, "replaceability": "medium"},
    {"id": "pkg-csv-parser",      "name": "csv-parser",      "version": "1.4.0", "severity": 2, "replaceability": "high"},
    {"id": "pkg-crypto-utils",    "name": "crypto-utils",    "version": "1.0.0", "severity": 6, "replaceability": "low"},
    {"id": "pkg-oauth-lib",       "name": "oauth-lib",       "version": "2.1.0", "severity": 7, "replaceability": "low"},
    {"id": "pkg-webhook-lib",     "name": "webhook-lib",     "version": "1.0.1", "severity": 3, "replaceability": "medium"},
    {"id": "pkg-storage-driver",  "name": "storage-driver",  "version": "2.0.0", "severity": 4, "replaceability": "medium"},
]

# app -> service edges
APP_SERVICE_EDGES = [
    ("app-auth-portal", "svc-auth"), ("app-auth-portal", "svc-session"),
    ("app-payments", "svc-payment"), ("app-payments", "svc-billing"), ("app-payments", "svc-audit"),
    ("app-checkout", "svc-payment"), ("app-checkout", "svc-user"), ("app-checkout", "svc-inventory"),
    ("app-admin", "svc-admin-api"), ("app-admin", "svc-audit"), ("app-admin", "svc-config"),
    ("app-mobile", "svc-auth"), ("app-mobile", "svc-user"), ("app-mobile", "svc-notification"),
    ("app-analytics", "svc-analytics"), ("app-analytics", "svc-reporting"), ("app-analytics", "svc-search"),
    ("app-support", "svc-notification"), ("app-support", "svc-user"),
    ("app-marketing", "svc-search"), ("app-marketing", "svc-media"),
    ("app-partner-api", "svc-gateway"), ("app-partner-api", "svc-auth"), ("app-partner-api", "svc-audit"),
    ("app-internal-tools", "svc-config"), ("app-internal-tools", "svc-reporting"), ("app-internal-tools", "svc-recommend"),
]

# service -> package edges (direct)
SERVICE_PACKAGE_EDGES = [
    ("svc-auth", "pkg-auth-lib"), ("svc-auth", "pkg-jwt-lib"), ("svc-auth", "pkg-oauth-lib"),
    ("svc-session", "pkg-token-lib"), ("svc-session", "pkg-cache-client"),
    ("svc-payment", "pkg-crypto-lib"), ("svc-payment", "pkg-orm-core"), ("svc-payment", "pkg-retry-lib"),
    ("svc-billing", "pkg-orm-core"), ("svc-billing", "pkg-pdf-generator"),
    ("svc-notification", "pkg-email-client"), ("svc-notification", "pkg-sms-client"), ("svc-notification", "pkg-queue-client"),
    ("svc-analytics", "pkg-utility-lib"), ("svc-analytics", "pkg-metrics-lib"),
    ("svc-reporting", "pkg-csv-parser"), ("svc-reporting", "pkg-pdf-generator"),
    ("svc-search", "pkg-search-index"), ("svc-search", "pkg-utility-lib"),
    ("svc-gateway", "pkg-http-client"), ("svc-gateway", "pkg-rate-limiter"), ("svc-gateway", "pkg-graphql-core"),
    ("svc-audit", "pkg-logging-lib"), ("svc-audit", "pkg-hash-lib"),
    ("svc-inventory", "pkg-orm-core"), ("svc-inventory", "pkg-uuid-lib"),
    ("svc-recommend", "pkg-utility-lib"), ("svc-recommend", "pkg-metrics-lib"),
    ("svc-media", "pkg-image-processor"), ("svc-media", "pkg-compression-lib"),
    ("svc-config", "pkg-config-loader"), ("svc-config", "pkg-schema-lib"),
    ("svc-admin-api", "pkg-http-client"), ("svc-admin-api", "pkg-validator"),
]

# package -> package edges (transitive deps) — this is where crypto-lib/utility-lib become hubs
PACKAGE_PACKAGE_EDGES = [
    ("pkg-auth-lib", "pkg-crypto-lib"), ("pkg-auth-lib", "pkg-hash-lib"),
    ("pkg-jwt-lib", "pkg-crypto-lib"), ("pkg-jwt-lib", "pkg-encoding-lib"),
    ("pkg-oauth-lib", "pkg-crypto-lib"), ("pkg-oauth-lib", "pkg-http-client"),
    ("pkg-token-lib", "pkg-crypto-lib"), ("pkg-token-lib", "pkg-uuid-lib"),
    ("pkg-orm-core", "pkg-utility-lib"), ("pkg-orm-core", "pkg-serializer"),
    ("pkg-http-client", "pkg-utility-lib"), ("pkg-http-client", "pkg-retry-lib"),
    ("pkg-search-index", "pkg-utility-lib"), ("pkg-search-index", "pkg-compression-lib"),
    ("pkg-metrics-lib", "pkg-utility-lib"),
    ("pkg-csv-parser", "pkg-utility-lib"),
    ("pkg-pdf-generator", "pkg-utility-lib"), ("pkg-pdf-generator", "pkg-compression-lib"),
    ("pkg-validator", "pkg-utility-lib"),
    ("pkg-queue-client", "pkg-serializer"), ("pkg-queue-client", "pkg-crypto-utils"),
    ("pkg-hash-lib", "pkg-crypto-utils"),
    ("pkg-crypto-lib", "pkg-crypto-utils"),
    ("pkg-graphql-core", "pkg-schema-lib"), ("pkg-graphql-core", "pkg-json-parser"),
    ("pkg-config-loader", "pkg-json-parser"),
    ("pkg-webhook-lib", "pkg-http-client"),
    ("pkg-storage-driver", "pkg-file-storage"),
    ("pkg-email-client", "pkg-template-engine"),
]

def get_sample_ecosystem() -> dict:
    nodes = []
    for a in APPLICATIONS:
        nodes.append({"id": a["id"], "type": "application", "name": a["name"], "criticality": a["criticality"]})
    for s in SERVICES:
        nodes.append({"id": s["id"], "type": "service", "name": s["name"]})
    for p in PACKAGES:
        nodes.append({
            "id": p["id"], "type": "package", "name": p["name"], "version": p["version"],
            "severity": p["severity"], "replaceability": p["replaceability"],
        })

    edges = []
    for src, tgt in APP_SERVICE_EDGES + SERVICE_PACKAGE_EDGES + PACKAGE_PACKAGE_EDGES:
        edges.append({"source": src, "target": tgt, "relation": "depends_on"})

    return {"nodes": nodes, "edges": edges}