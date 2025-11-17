ב״ה
# Living with the Rebbe - Project Brief

## What This Tool Does

**Living with the Rebbe** is an admin tool for ChabadUniverse that processes newsletter HTML before distribution. When administrators paste newsletter content into the app, it automatically finds all linked resources (PDFs, images, documents), uploads them to the ChabadUniverse CMS, and replaces the original URLs with secure CMS URLs. The result is a modified newsletter where all resources are centrally hosted and access-controlled through the ChabadUniverse platform.

The tool solves a key problem: currently, newsletter resources are hosted on various external servers. This tool centralizes everything on ChabadUniverse's CMS, where the platform can control access - authenticated users see resources within the app, while others are redirected to the public website. Administrators simply paste their HTML, click process, and receive updated HTML ready for distribution to subscribers.

## How It Works

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  📝 PASTE HTML  │────▶│  🔍 PARSE LINKS │────▶│ 📥 DOWNLOAD     │
│                 │     │                 │     │    RESOURCES    │
│ Admin pastes    │     │ Find all PDFs,  │     │ Fetch files     │
│ newsletter HTML │     │ images, docs    │     │ from sources    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                         │
                                                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ ✅ GET OUTPUT   │◀────│ 🔄 REPLACE URLs │◀────│ ☁️ UPLOAD TO    │
│                 │     │                 │     │     CMS         │
│ Modified HTML   │     │ Swap external   │     │ Via Valu API    │
│ ready to send   │     │ links with CMS  │     │ get new URLs    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Processing Flow Example

**Input HTML:**
```html
<p>Download the <a href="https://external-site.com/torah.pdf">Torah portion</a></p>
```

**Output HTML:**
```html
<p>Download the <a href="https://cms.chabaduniverse.com/api/resource/abc123">Torah portion</a></p>
```

The CMS URL (`abc123`) automatically:
- ✅ Checks viewer authentication
- ✅ Redirects authenticated users to in-app view
- ✅ Redirects public users to website view
- ✅ Tracks resource access

## Key Features

| Feature | Description |
|---------|------------|
| **HTML Processing** | Paste newsletter HTML and get modified version |
| **Resource Detection** | Automatically finds all external PDFs, images, documents |
| **CMS Integration** | Uploads resources via Valu API to ChabadUniverse |
| **URL Replacement** | Swaps external URLs with secure CMS URLs |
| **Auth Handling** | CMS URLs manage viewer authentication automatically |
| **Preview Mode** | Review changes before using modified HTML |

## Benefits

- 🏠 **Centralized Hosting**: All newsletter resources on one platform
- 🔒 **Access Control**: CMS handles who can view resources
- ⚡ **Quick Processing**: Just a minute or so for typical newsletter
- 🎯 **No Manual Work**: Fully automated resource handling
- 📊 **Usage Tracking**: CMS can track resource access