# Manual SSL Certificate Setup and Renewal Guide for Heroku

This document describes how to set up and renew a manual Let's Encrypt SSL certificate for a Heroku app using certbot and DNS challenges. It covers initial setup, renewal, and common issues.

## Prerequisites

- A working Heroku app (ankit-github-demo-app in this example)
- A domain managed via Namecheap (e.g., ankit.herokuhyderabad.com)
- Heroku CLI installed and logged in
- Certbot installed (certbot --version should work)
- Root access to the machine for Certbot

## Initial Setup

### 1. Generate Certificate with Certbot

Use manual DNS mode:

```bash
sudo certbot certonly --manual --preferred-challenges dns -d ankit.herokuhyderabad.com
```

**Steps:**

1. Enter your email and accept terms
2. Certbot will output a required TXT record under `_acme-challenge.ankit.herokuhyderabad.com` with a random value
3. Go to Namecheap → Advanced DNS → Host Records:
   - Add or edit a TXT record:
     - Host: `_acme-challenge.ankit`
     - Value: the value given by Certbot
     - TTL: Automatic
4. Wait for propagation. Verify with:
   ```bash
   dig TXT _acme-challenge.ankit.herokuhyderabad.com +short
   ```
   It must return the same value Certbot asked for.
5. Press Enter in the Certbot terminal once the DNS record is live
6. If successful, Certbot saves files in:
   - `/etc/letsencrypt/live/ankit.herokuhyderabad.com/fullchain.pem`
   - `/etc/letsencrypt/live/ankit.herokuhyderabad.com/privkey.pem`

### 2. Remove Any Existing ACM Certificates

If ACM (Automatic Certificate Management) is enabled on Heroku, disable and remove ACM certs:

```bash
heroku certs --app ankit-github-demo-app
heroku certs:remove --name <acm-cert-name> --app ankit-github-demo-app --confirm ankit-github-demo-app
```

### 3. Upload Manual Certificate to Heroku

```bash
sudo heroku certs:add /etc/letsencrypt/live/ankit.herokuhyderabad.com/fullchain.pem \
                      /etc/letsencrypt/live/ankit.herokuhyderabad.com/privkey.pem \
                      --app ankit-github-demo-app
```

**During the prompt:**
- Press space to select ankit.herokuhyderabad.com
- Press enter

### 4. Verify Installation

**Check Heroku certs:**
```bash
heroku certs --app ankit-github-demo-app
```

**Expected output:**
```
Name              Common Name(s)            Expires              Trusted Type Domains
───────────────── ───────────────────────── ──────────────────── ─────── ──── ───────
stegosaurus-50445 ankit.herokuhyderabad.com 2026-01-01 18:38 UTC True    SNI  1
```

**Check HTTPS:**
```bash
curl -Iv https://ankit.herokuhyderabad.com
```

**Look for:**
- issuer: Let's Encrypt
- expire date: Jan 2026
- SSL certificate verify ok

## Renewal (Every 90 Days)

Manual certificates from Let's Encrypt are valid for 90 days. You must renew before expiry.

### Steps to Renew

1. **Run Certbot again:**
   ```bash
   sudo certbot certonly --manual --preferred-challenges dns -d ankit.herokuhyderabad.com
   ```

2. **Certbot gives a new TXT value. Update DNS TXT in Namecheap:**
   - Host: `_acme-challenge.ankit`
   - Value: the new value from Certbot

3. **Verify with:**
   ```bash
   dig TXT _acme-challenge.ankit.herokuhyderabad.com +short
   ```

4. **Once successful, Certbot updates the files in:**
   - `/etc/letsencrypt/live/ankit.herokuhyderabad.com/fullchain.pem`
   - `/etc/letsencrypt/live/ankit.herokuhyderabad.com/privkey.pem`

5. **Update the cert in Heroku:**
   ```bash
   sudo heroku certs:update /etc/letsencrypt/live/ankit.herokuhyderabad.com/fullchain.pem \
                            /etc/letsencrypt/live/ankit.herokuhyderabad.com/privkey.pem \
                            --app ankit-github-demo-app
   ```

6. **Verify again with:**
   ```bash
   heroku certs --app ankit-github-demo-app
   curl -Iv https://ankit.herokuhyderabad.com
   ```

## FAQs and Common Issues

### Q1: Certbot says "Incorrect TXT record found"

**Cause:** You pressed Enter before DNS propagation finished.

**Fix:** Run `dig TXT _acme-challenge.ankit.herokuhyderabad.com +short` and confirm it matches. Wait 2–5 minutes.

### Q2: heroku certs:add fails with ENOTFOUND api.heroku.com

**Cause:** Local DNS cache issue.

**Fix:**
```bash
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
heroku logout
heroku login
```

Then retry `heroku certs:add`.

### Q3: Dashboard still shows ACM cert

**Cause:** ACM was enabled previously.

**Fix:** Disable ACM and remove ACM cert:
```bash
heroku certs:auto:disable --app ankit-github-demo-app --confirm ankit-github-demo-app
heroku certs:remove --name <acm-cert-name> --app ankit-github-demo-app --confirm ankit-github-demo-app
```

### Q4: Should I use ACM or Manual SSL?

**ACM:** Best for most cases. Auto-renews, no manual steps.

**Manual SSL:** Only needed if you want custom certs (wildcards, EV, or a different CA).

### Q5: How to rollback to ACM?

```bash
heroku certs:auto:enable --app ankit-github-demo-app
```

## Best Practices

- Always verify with `dig` before pressing Enter in Certbot
- Schedule a calendar reminder before cert expiry (every 60–80 days)
- Keep both certbot and Heroku CLI updated
- Use ACM unless you have a strong reason for manual certs

## Command Reference

### Certificate Management
```bash
# List certificates
heroku certs --app ankit-github-demo-app

# Add certificate
heroku certs:add fullchain.pem privkey.pem --app ankit-github-demo-app

# Update certificate
heroku certs:update fullchain.pem privkey.pem --app ankit-github-demo-app

# Remove certificate
heroku certs:remove --name <cert-name> --app ankit-github-demo-app --confirm ankit-github-demo-app

# Enable ACM
heroku certs:auto:enable --app ankit-github-demo-app

# Disable ACM
heroku certs:auto:disable --app ankit-github-demo-app --confirm ankit-github-demo-app
```

### DNS Verification
```bash
# Check TXT record
dig TXT _acme-challenge.ankit.herokuhyderabad.com +short

# Check certificate details
curl -Iv https://ankit.herokuhyderabad.com

# Check certificate expiry
openssl s_client -connect ankit.herokuhyderabad.com:443 -servername ankit.herokuhyderabad.com < /dev/null 2>/dev/null | openssl x509 -noout -dates
```

### Certbot Commands
```bash
# Generate new certificate
sudo certbot certonly --manual --preferred-challenges dns -d ankit.herokuhyderabad.com

# List certificates
sudo certbot certificates

# Check certbot version
certbot --version

# Dry run renewal
sudo certbot renew --dry-run
```

## Troubleshooting

### DNS Propagation Issues

If DNS changes are not propagating:

1. **Check TTL settings** in Namecheap (should be low, like 300 seconds)
2. **Wait longer** - DNS can take up to 24 hours in some cases
3. **Use different DNS servers** to check:
   ```bash
   dig @8.8.8.8 TXT _acme-challenge.ankit.herokuhyderabad.com +short
   dig @1.1.1.1 TXT _acme-challenge.ankit.herokuhyderabad.com +short
   ```

### Certificate Upload Issues

If certificate upload fails:

1. **Check file permissions:**
   ```bash
   sudo ls -la /etc/letsencrypt/live/ankit.herokuhyderabad.com/
   ```

2. **Verify certificate validity:**
   ```bash
   sudo openssl x509 -in /etc/letsencrypt/live/ankit.herokuhyderabad.com/fullchain.pem -text -noout
   ```

3. **Check private key:**
   ```bash
   sudo openssl rsa -in /etc/letsencrypt/live/ankit.herokuhyderabad.com/privkey.pem -check
   ```

### Heroku CLI Issues

If Heroku CLI commands fail:

1. **Update Heroku CLI:**
   ```bash
   heroku update
   ```

2. **Re-authenticate:**
   ```bash
   heroku logout
   heroku login
   ```

3. **Check app access:**
   ```bash
   heroku apps:info --app ankit-github-demo-app
   ```

## Security Considerations

- **Keep private keys secure** - Never share or commit private keys to version control
- **Use strong file permissions** on certificate files (600 or 644)
- **Monitor certificate expiry** - Set up alerts before certificates expire
- **Use HTTPS redirects** in your application to force secure connections
- **Implement HSTS headers** for additional security

## Automation Options

While this guide covers manual renewal, consider these automation options:

### Option 1: Cron Job for Renewal Reminders
```bash
# Add to crontab to get reminded 30 days before expiry
0 9 1 * * echo "Check SSL certificate expiry for ankit.herokuhyderabad.com" | mail -s "SSL Reminder" your-email@example.com
```

### Option 2: Automated DNS Updates
If your DNS provider has an API, you can automate the TXT record updates during renewal.

### Option 3: Switch to ACM
For most use cases, Heroku's Automatic Certificate Management (ACM) is recommended as it handles renewal automatically.

## Related Documentation

- [Heroku SSL Documentation](https://devcenter.heroku.com/articles/ssl)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Certbot Documentation](https://certbot.eff.org/docs/)
- [DNS Challenge Documentation](https://letsencrypt.org/docs/challenge-types/#dns-01-challenge)

---

**Note:** This guide is specific to manual SSL certificate management. For most production applications, consider using Heroku's Automatic Certificate Management (ACM) which handles certificate provisioning and renewal automatically.
