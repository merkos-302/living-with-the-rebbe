# Admin UI Components

This directory contains all admin interface components for the Living with the Rebbe newsletter processing tool.

## Components

### Input Components

#### `HtmlInput.tsx`
Dual-mode HTML input component supporting:
- **URL Fetch Mode** (default): Fetches HTML from S3/web URLs with automatic relative URL resolution
- **Paste Mode** (fallback): Manual HTML paste with base URL field for relative URL resolution

#### `UrlInput.tsx`
URL input interface with validation and fetching capabilities.

### Display Components

#### `ParseResults.tsx`
Grid display of extracted resources with:
- Filtering by resource type (PDF, Image, Document, Unknown)
- Statistics overview
- Resource preview cards

#### `ResourcePreview.tsx`
Individual resource card displaying:
- Resource type and icon
- URL and filename
- File extension badge
- External/internal indicator

#### `HtmlPreview.tsx`
Code viewer component with:
- Syntax highlighting
- Line numbers
- Copy to clipboard
- Formatted/raw view toggle
- Expand/collapse functionality

### Processing Components

#### `ProcessingProgress.tsx`
Real-time processing status display showing:
- Current stage (Parsing, Downloading, Uploading, Replacing)
- Progress bar with percentage (0-100%)
- Resource count (X of Y processed)
- Stage-specific icons and colors
- Visual progress steps

**Props:**
```typescript
interface ProcessingProgressProps {
  stage: ProcessingStage;
  progress: number;
  resourceCount?: number;
  totalResources?: number;
}
```

**Stages:**
- `PARSING` - Extracting resources from HTML (blue)
- `DOWNLOADING` - Downloading resources from original URLs (purple)
- `UPLOADING` - Uploading to ChabadUniverse CMS (indigo)
- `REPLACING` - Replacing URLs in HTML (green)
- `COMPLETE` - Processing finished successfully (green)
- `FAILED` - Processing failed (red)

#### `ProcessedOutput.tsx`
Final output display with:
- Success banner with action buttons
- Processing statistics (time, data transfer, by type)
- Copy to clipboard functionality
- Download HTML file option
- Error and warning display
- Processed HTML preview with syntax highlighting

**Props:**
```typescript
interface ProcessedOutputProps {
  result: ProcessingResult;
}
```

**Features:**
- Comprehensive statistics breakdown
- Time breakdown by stage
- Data transfer statistics (downloaded/uploaded bytes)
- Resource type breakdown (PDF, Image, Document, Unknown)
- Formatted time and byte displays
- One-click copy and download

## Usage Flow

### 1. Input HTML
```tsx
<HtmlInput
  onSubmit={handleHtmlSubmit}
  isProcessing={isLoading}
  needsBaseUrl={needsBaseUrl}
/>
```

### 2. Display Parse Results
```tsx
<ParseResults
  resources={resources}
  onClear={handleReset}
/>
```

### 3. Process Newsletter
```tsx
<button onClick={handleProcess}>
  Process Newsletter
</button>
```

### 4. Show Processing Progress
```tsx
{isProcessing && (
  <ProcessingProgress
    stage={stage}
    progress={progress}
    resourceCount={processedCount}
    totalResources={totalResources}
  />
)}
```

### 5. Display Processed Output
```tsx
{processingResult && (
  <ProcessedOutput result={processingResult} />
)}
```

## Component Dependencies

```
HtmlInput
  └─ UrlInput

ParseResults
  └─ ResourcePreview

ProcessingProgress
  (standalone)

ProcessedOutput
  └─ HtmlPreview
```

## Styling

All components use Tailwind CSS with consistent design patterns:
- Blue theme for primary actions
- Color-coded stages (blue → purple → indigo → green)
- Consistent spacing and borders
- Accessible color contrasts
- Responsive grid layouts

## Error Handling

Components display errors at appropriate stages:
- **Parsing errors** - Red banner with "Try Again" button
- **Processing errors** - Red banner with "Retry Processing" button
- **Resource errors** - Individual error display in statistics
- **Warnings** - Yellow banner with warning list

## Icons

Uses Lucide React icons:
- `Play` - Process action
- `RotateCcw` - Reset/retry actions
- `Loader2` - Loading spinner
- `CheckCircle2` - Success states
- `XCircle` - Error states
- `Download` - Download action
- `Upload` - Upload stage
- `Link` - URL replacement stage
- `FileText` - Parsing stage
- `Copy` - Copy to clipboard

## Future Enhancements

Potential improvements:
- Real-time resource processing updates
- Resource preview modals
- Drag-and-drop file upload
- Batch processing history
- Export processing reports
- Before/after HTML comparison view
