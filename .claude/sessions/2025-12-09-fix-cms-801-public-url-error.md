# Fix CMS 801 Error - Public URL Generation

**Date:** 2025-12-09

## Session Overview

| Field | Value |
|-------|-------|
| Date | 2025-12-09 |
| Branch | `fix/cms-801-public-url-error` |
| Type | Bug fix |
| Status | Complete |

## Problem

After uploading files to the Valu CMS, the generated public URLs returned an **801 HTTP error** from `api.roomful.net`. The upload appeared to succeed, but accessing the public URL failed.

Notably, the **ValuSampleApp** (reference implementation) worked correctly with the same Valu API.

## Investigation

### Comparing the Two Implementations

**ValuSampleApp** (`/components/ApplicationStorage.tsx`):
```typescript
// After upload, waits and reloads file list via resource-search
setTimeout(async () => {
  await loadFiles()  // Calls resource-search, gets resource.id
}, 1000)

// Later, when user clicks "Copy Public URL":
const intent = new Intent("Resources", "generate-public-url", {
  resourceId: selectedFile.id,  // ID from resource-search
})
```

**Living-with-the-rebbe** (`/lib/cms/cms-uploader.ts`):
```typescript
// Immediately after upload, uses ID from upload response
const resourceId = resolvedResource.uuid || resolvedResource.id;  // Preferred uuid!
const publicUrl = await generatePublicUrl(valuApi, resourceId);
```

### Root Cause

Two issues identified:

1. **Wrong ID format**: The upload response contains both `id` and `uuid` fields. The code preferred `uuid`, but `generate-public-url` expects the same `id` format that `resource-search` returns.

2. **No processing delay**: The Valu API documentation explicitly warns that "files may still be processing after upload" and recommends adding a delay before fetching URLs.

### Evidence from Valu API Documentation

From `../valu-api/FILE_STORAGE_API.md`:

> **Thumbnail URL returns undefined**
> - The file may still be processing after upload
> - **Add a small delay after upload before fetching thumbnails**
> - Check if the resourceId is correct

## Solution

Modified `/lib/cms/cms-uploader.ts` (lines 145-166):

### Before
```typescript
const resourceId = resolvedResource.uuid || resolvedResource.id;
// ... immediately called generatePublicUrl
```

### After
```typescript
// IMPORTANT: Use `id` not `uuid` - the `generate-public-url` API expects
// the same ID format returned by `resource-search`, which is `id`.
// Using `uuid` causes 801 errors from the Roomful API.
const resourceId = resolvedResource.id;
const metadata = resolvedResource.metadata || {};

logger.info('File uploaded successfully', {
  resourceId,
  uuid: resolvedResource.uuid, // Log both for debugging
  filename: metadata.fileName || download.filename,
  size: metadata.fileSize || download.size,
  attempt,
  duration: Date.now() - startTime,
});

// Wait for the server to finish processing the upload before generating URL
// The Valu API documentation warns that files may still be processing after upload
await sleep(1000);

// Generate public URL using the resource ID
const publicUrl = await generatePublicUrl(valuApi, resourceId);
```

## Changes Summary

| Change | Reason |
|--------|--------|
| Use `resolvedResource.id` instead of `uuid \|\| id` | Matches format expected by `generate-public-url` |
| Added 1-second delay before URL generation | Allows server to finish processing upload |
| Log both `id` and `uuid` | Debugging aid for future issues |

## Testing

- All 305 existing tests pass
- Manual testing in ChabadUniverse iframe confirms fix works

## Files Modified

- `lib/cms/cms-uploader.ts` - Lines 145-166

## Key Learnings

1. **Different ID formats**: The Valu upload response has `id` and `uuid` - they are NOT interchangeable. Use `id` for API calls.

2. **Follow reference implementations**: ValuSampleApp's pattern of reload-after-upload exists for a reason.

3. **Read the docs**: The Valu API documentation explicitly warns about processing delays.
