ב״ה
# Testing Authentication Locally

Quick guide to test the Valu API authentication implementation on your local machine.

## Quick Start

### Option 1: Dev Mode (Fastest)

1. **Enable dev mode in `.env.local`**:
   ```bash
   NEXT_PUBLIC_VALU_DEV_MODE=true
   ```

2. **Start the dev server**:
   ```bash
   npm run dev
   ```

3. **Open in browser**:
   ```
   http://localhost:3000
   ```

4. **What you'll see**:
   - Since dev mode bypasses iframe check, you'll see the loading spinner
   - The app will try to authenticate via Valu API
   - Since there's no parent frame, authentication will fail gracefully
   - You'll see "Authentication Failed" with a retry button

### Option 2: Test Harness (Recommended)

This simulates the actual ChabadUniverse parent frame.

1. **Start the dev server**:
   ```bash
   npm run dev
   ```

2. **Open the test harness**:
   ```
   http://localhost:3000/test-harness.html
   ```

3. **Configure mock user**:
   - **User Name**: Test Admin
   - **User Email**: admin@test.com
   - **User Role**: Channel Admin (Has Access)

4. **What you'll see**:
   - The iframe loads your app at `http://localhost:3000`
   - The app requests verification from parent
   - Test harness sends mock authentication
   - User is authenticated as admin
   - Dashboard is displayed with welcome message

## Testing Different Scenarios

### Test 1: Admin User (Should Succeed)

**Setup**:
- Role: "Channel Admin" or "Admin"

**Expected**:
```
✅ Authenticated as Admin
Welcome, Test Admin!

[Dashboard content shown]
```

### Test 2: Regular User (Should Fail)

**Setup**:
- Role: "Regular User"

**Expected**:
```
❌ Admin Access Required
Only channel administrators can access this tool.

[No dashboard access]
```

### Test 3: Direct Browser Access (Should Block)

**Setup**:
1. Set `NEXT_PUBLIC_VALU_DEV_MODE=false` in `.env.local`
2. Restart server
3. Open `http://localhost:3000` directly (not in test harness)

**Expected**:
```
🛡️ Access via ChabadUniverse
This admin tool must be accessed through the ChabadUniverse platform.

[Link to ChabadUniverse]
```

## Test Harness Features

### User Configuration
- **Name**: Customize admin name
- **Email**: Set email address
- **Role**: Switch between admin/user

### Message Log
Watch the message exchange between iframe and parent:
```
[10:30:45] Iframe loaded - waiting for verification request...
[10:30:45] Received message: {"type":"valu-verify"}
[10:30:45] Iframe requested verification - sending mock auth
[10:30:46] Sending auth message for user: Test Admin (channel_admin)
```

### Controls
- **Reload Iframe**: Refresh app after code changes
- **Send Auth Message**: Manually trigger authentication
- **Clear Status Log**: Reset message log

## Debugging Tips

### Issue: "Valu API not ready"

**Cause**: API connection not established

**Solution**:
1. Check browser console for errors
2. Verify you're using test harness (not direct access)
3. Click "Send Auth Message" button in test harness

### Issue: "Authentication Failed"

**Cause**: No user data received from parent

**Solution**:
1. Open browser DevTools
2. Check console for message logs
3. Verify test harness is sending auth messages
4. Click "Retry Authentication" button

### Issue: "Admin Access Required"

**Cause**: User doesn't have admin role

**Solution**:
1. In test harness, change "User Role" to "Channel Admin"
2. Click "Send Auth Message"
3. Click "Reload Iframe"

### Issue: Blank screen or infinite loading

**Cause**: Various possible issues

**Solution**:
1. Open browser DevTools → Console
2. Look for JavaScript errors
3. Check Network tab for failed requests
4. Verify dev server is running on port 3000

## Browser Console Messages

### Normal Flow (Success)
```
[INFO] Initializing Valu API connection...
[INFO] ✓ Valu API connected
[INFO] Loading user from cache
[INFO] Fetching user from Valu API...
[DEBUG] User fetched via users.current
[INFO] ✓ User authenticated: Test Admin
```

### Failed Authentication
```
[INFO] Initializing Valu API connection...
[WARN] Not running in iframe - Valu API unavailable
[DEBUG] Cannot fetch user - API not ready
[ERROR] Auth initialization error: [Error details]
```

### Direct Access (Iframe Check Failed)
```
[WARN] Not running in iframe - direct access blocked
[DEBUG] Not in iframe - skipping auth
```

## Testing Checklist

Use this checklist to verify all authentication scenarios:

- [ ] **Direct Access Block**: Open `http://localhost:3000` → See access denied
- [ ] **Dev Mode Bypass**: Enable dev mode → Access without iframe
- [ ] **Test Harness Load**: Open harness → Iframe loads successfully
- [ ] **Admin Login**: Set admin role → See dashboard
- [ ] **User Rejection**: Set user role → Access denied
- [ ] **Loading State**: Watch for spinner during auth
- [ ] **Error Handling**: Disconnect iframe → See error message
- [ ] **Retry Button**: Click retry → Re-authenticate
- [ ] **Cache Test**: Reload page → Faster loading from cache
- [ ] **Message Exchange**: Watch status log → Messages flowing

## Next Steps

Once authentication is working:
1. Proceed to Day 2: HTML Processing Interface
2. Keep test harness open for testing new features
3. Use dev mode for rapid development

## Questions?

- Check `/docs/DAY1_AUTHENTICATION_IMPLEMENTATION.md` for details
- Review `/docs/VALU_AUTHENTICATION_REFERENCE.md` for patterns
- Check browser console for specific error messages
