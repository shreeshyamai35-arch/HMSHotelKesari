# DNS Setup Guide

## Overview

Configure `hms.daamjigroups.com` to point to Vercel by adding a CNAME record at your domain registrar.

---

## DNS Record Details

Add the following CNAME record to your DNS zone for `daamjigroups.com`:

| Type  | Name | Value                  | TTL  |
|-------|------|------------------------|------|
| CNAME | hms  | cname.vercel-dns.com   | Auto |

**Result:** `hms.daamjigroups.com` → Vercel edge network

---

## Step-by-Step Instructions

### 1. Log in to Your Domain Registrar

Access the DNS management panel for `daamjigroups.com`. Common registrars include:

- **GoDaddy**: My Products → Domains → DNS Management
- **Namecheap**: Domain List → Manage → Advanced DNS
- **Cloudflare**: Select domain → DNS
- **Google Domains**: My domains → Manage → DNS
- **AWS Route 53**: Hosted zones → Select zone
- **Hostinger**: Domains → Manage → DNS / Name Servers

### 2. Navigate to DNS Records

Look for sections labeled:
- DNS Management
- DNS Records
- DNS Zone Editor
- Manage DNS
- Advanced DNS

### 3. Add the CNAME Record

Click **Add Record** or **Add New Record**, then enter:

- **Type**: Select `CNAME`
- **Name** / **Host** / **Alias**: Enter `hms`
  - Some registrars require `hms.daamjigroups.com` (full domain)
  - Others only need `hms` (subdomain prefix)
- **Value** / **Points to** / **Target**: Enter `cname.vercel-dns.com`
  - Do **not** include `http://` or `https://`
  - Do **not** add a trailing dot (most registrars handle this automatically)
- **TTL**: Leave as `Auto` or `3600` (1 hour)

### 4. Save the Record

Click **Save**, **Add Record**, or **Update**.

### 5. Wait for Propagation

DNS changes typically propagate within:
- **5-30 minutes**: Most registrars
- **Up to 24-48 hours**: Maximum (rare)

---

## Verification

### Check DNS Propagation

Use these tools to confirm the CNAME record is live:

```bash
# Command line
nslookup hms.daamjigroups.com
dig hms.daamjigroups.com CNAME
```

**Expected output:**
```
hms.daamjigroups.com canonical name = cname.vercel-dns.com
```

**Online tools:**
- https://dnschecker.org
- https://www.whatsmydns.net

### Verify in Vercel

1. Go to your Vercel project → **Settings** → **Domains**
2. Add `hms.daamjigroups.com`
3. Vercel will automatically detect the CNAME and provision SSL

---

## Troubleshooting

### Record Not Resolving

- **Check the Name field**: Use `hms` (not `hms.daamjigroups.com`) unless your registrar requires the full domain
- **Remove trailing dots**: Most registrars auto-append the root domain
- **Wait longer**: Propagation can take up to 48 hours
- **Clear DNS cache**: Run `ipconfig /flushdns` (Windows) or `sudo dscacheutil -flushcache` (Mac)

### Cloudflare Proxy Warning

If using Cloudflare, ensure the CNAME record is **not proxied** (gray cloud icon) during initial setup. After Vercel provisions SSL, you can enable the proxy (orange cloud).

### Existing A or CNAME Conflict

If `hms` already points elsewhere, delete the old record before adding the new CNAME. A subdomain can only have one CNAME record.

---

## Next Steps

After DNS propagates:

1. Add `hms.daamjigroups.com` in Vercel → Settings → Domains
2. Vercel will issue an SSL certificate automatically (Let's Encrypt)
3. Test the domain: `https://hms.daamjigroups.com`

---

## Reference

- [Vercel Custom Domains Documentation](https://vercel.com/docs/concepts/projects/domains)
- [DNS Propagation Checker](https://dnschecker.org)
