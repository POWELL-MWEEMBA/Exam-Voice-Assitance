# 🔧 Network Error Troubleshooting

## Error: "Network Error" when loading signals

This means the mobile app cannot connect to the backend API.

### ✅ **Quick Fixes:**

### 1. **Check Backend is Running**
```bash
# In backend terminal:
cd backend
php artisan serve
```
You should see: `Server running on [http://127.0.0.1:8000]`

### 2. **Find Your Computer's IP Address**

**Windows:**
```bash
ipconfig
```
Look for: `IPv4 Address: 192.168.x.x`

**Mac:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Linux:**
```bash
ip addr show | grep "inet " | grep -v 127.0.0.1
```

### 3. **Update Mobile API URL**

Edit `mobile/.env`:
```env
# ❌ Don't use this for physical device:
EXPO_PUBLIC_API_URL=http://localhost:8000/api

# ✅ Use your computer's IP instead:
EXPO_PUBLIC_API_URL=http://192.168.1.100:8000/api
```

**Replace `192.168.1.100` with YOUR computer's IP!**

### 4. **Reload Mobile App**
```bash
# In mobile terminal, press:
r  # Reload app
```

---

## 📱 **Testing Connection**

### Test 1: Backend is accessible
Open in browser: `http://YOUR_IP:8000/api/contexts`

Should see JSON with contexts like:
```json
{
  "data": [
    {"id": 1, "name": "Fresh Fish Available", "emoji": "🐟"},
    ...
  ]
}
```

### Test 2: Check mobile logs
```bash
# In mobile terminal where npm start is running
# You should see:
API URL: http://192.168.1.100:8000/api
```

---

## 🚨 **Common Issues:**

### Issue: "Connection refused"
**Cause:** Backend not running
**Fix:** Run `php artisan serve` in backend folder

### Issue: "Network timeout"
**Cause:** Firewall blocking port 8000
**Fix (Windows):**
```powershell
# Allow PHP through Windows Firewall
New-NetFirewallRule -DisplayName "Laravel Dev Server" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow
```

### Issue: "Still can't connect"
**Cause:** Wrong IP or not on same WiFi
**Fix:**
1. Ensure phone and computer on SAME WiFi network
2. Try running on emulator instead:
   - Android: Press `a` in Expo terminal
   - iOS: Press `i` in Expo terminal
3. For emulator, use `http://localhost:8000/api`

### Issue: "Works on emulator but not physical device"
**Cause:** Using localhost instead of IP
**Fix:** Use your computer's IP address (192.168.x.x)

---

## 🔍 **Debug Mode**

### Enable detailed logging:

Edit `mobile/src/services/api.ts`, add after line 22:
```typescript
// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    console.log('🌐 API Request:', config.method?.toUpperCase(), config.baseURL + config.url);
    const token = await AsyncStorage.getItem('auth_token');
    // ... rest of code
  }
);
```

This will show every API call in your terminal.

---

## ✅ **Complete Setup Checklist**

- [ ] Backend running: `php artisan serve`
- [ ] Backend accessible in browser: `http://YOUR_IP:8000/api/contexts`
- [ ] Mobile .env has correct IP: `EXPO_PUBLIC_API_URL=http://YOUR_IP:8000/api`
- [ ] Phone and computer on same WiFi
- [ ] Windows Firewall allows port 8000
- [ ] Mobile app reloaded after .env change

---

## 📞 **Still Not Working?**

### Use Android Emulator (Easier for testing):
```bash
# Start emulator
npm start
# Press 'a' for Android

# In emulator, localhost works:
EXPO_PUBLIC_API_URL=http://localhost:8000/api
```

### Check Laravel logs:
```bash
cd backend
tail -f storage/logs/laravel.log
```

### Check Expo logs:
Look at the mobile terminal where `npm start` is running. Any network errors will show there.

---

**Quick Test Command:**
```bash
# Test from your phone's browser:
# Go to: http://YOUR_IP:8000/api/contexts
# Should show JSON data
```
