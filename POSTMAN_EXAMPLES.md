# Postman API Examples

## Signup Endpoint

**URL:** `POST /api/auth/signup`

**Headers:**
```
Content-Type: application/json
```

---

### ✅ Minimal Request (Required Fields Only)

```json
{
  "phone": "9876543210",
  "deviceMacAddress": "AA:BB:CC:DD:EE:FF",
  "deviceIp": "192.168.1.100"
}
```

**Note:** Phone number can be:
- `9876543210` (10 digits - automatically adds +91)
- `+919876543210` (with country code)
- `+1-9876543210` (international format)

---

### ✅ Full Request (All Fields)

```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "9876543210",
  "deviceId": "device-uuid-12345",
  "deviceType": "mobile",
  "deviceModel": "iPhone 14 Pro",
  "deviceOs": "iOS",
  "deviceOsVersion": "17.0",
  "deviceBrowser": "Safari",
  "deviceBrowserVersion": "17.0",
  "deviceIp": "192.168.1.100",
  "deviceMacAddress": "AA:BB:CC:DD:EE:FF",
  "acceptedTerms": true,
  "marketingOptIn": false
}
```

---

### ✅ Mobile Device Example

```json
{
  "name": "Rajesh Kumar",
  "email": "rajesh@example.com",
  "phone": "9876543210",
  "deviceType": "mobile",
  "deviceModel": "Samsung Galaxy S23",
  "deviceOs": "Android",
  "deviceOsVersion": "13",
  "deviceBrowser": "Chrome",
  "deviceBrowserVersion": "120.0",
  "deviceIp": "192.168.1.105",
  "deviceMacAddress": "02:00:00:00:00:00",
  "acceptedTerms": true,
  "marketingOptIn": true
}
```

---

### ✅ Desktop/Laptop Example

```json
{
  "name": "Priya Sharma",
  "email": "priya@example.com",
  "phone": "9876543211",
  "deviceType": "desktop",
  "deviceModel": "MacBook Pro",
  "deviceOs": "macOS",
  "deviceOsVersion": "14.2",
  "deviceBrowser": "Chrome",
  "deviceBrowserVersion": "120.0",
  "deviceIp": "192.168.1.106",
  "deviceMacAddress": "a1:b2:c3:d4:e5:f6",
  "acceptedTerms": true,
  "marketingOptIn": false
}
```

---

### ✅ Tablet Example

```json
{
  "name": "Amit Singh",
  "phone": "9876543212",
  "deviceType": "tablet",
  "deviceModel": "iPad Air",
  "deviceOs": "iOS",
  "deviceOsVersion": "17.1",
  "deviceBrowser": "Safari",
  "deviceIp": "192.168.1.107",
  "deviceMacAddress": "f1:e2:d3:c4:b5:a6",
  "acceptedTerms": true
}
```

---

## Login Endpoint

**URL:** `POST /api/auth/login`

**Headers:**
```
Content-Type: application/json
```

### ✅ Login Request

```json
{
  "phone": "9876543210",
  "otp": "123456",
  "deviceIp": "192.168.1.100",
  "deviceMacAddress": "AA:BB:CC:DD:EE:FF"
}
```

**Minimal (Required Only):**
```json
{
  "phone": "9876543210",
  "otp": "123456"
}
```

---

## Send OTP Endpoint

**URL:** `POST /api/auth/send-otp`

```json
{
  "mobileNumber": "9876543210"
}
```

---

## Verify OTP Endpoint

**URL:** `POST /api/auth/verify-otp`

```json
{
  "mobileNumber": "9876543210",
  "otp": "123456"
}
```

---

## Response Examples

### Signup Success Response:
```json
{
  "success": true,
  "message": "OTP sent successfully to your WhatsApp",
  "userId": "65a1b2c3d4e5f6a7b8c9d0e1",
  "phone": "+919876543210",
  "otpSent": true
}
```

### Signup Error Response (Missing Fields):
```json
{
  "success": false,
  "message": "Missing required fields: phone, deviceMacAddress, deviceIp are required"
}
```

### Login Success Response:
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "65a1b2c3d4e5f6a7b8c9d0e1",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+919876543210",
    "isVerified": true,
    "plan": null,
    "planStartTime": null,
    "planExpiryTime": null,
    "isSessionActive": false
  }
}
```

---

## Field Descriptions

### Required Fields:
- **phone** (string): User's phone number (10 digits or with country code)
- **deviceMacAddress** (string): Device MAC address (format: AA:BB:CC:DD:EE:FF)
- **deviceIp** (string): Device IP address (format: 192.168.1.100)

### Optional Fields:
- **name** (string): User's full name (default: "User")
- **email** (string): User's email (default: phone@example.com)
- **deviceId** (string): Unique device identifier (default: deviceMacAddress)
- **deviceType** (string): Device type - "mobile", "desktop", "tablet" (default: "unknown")
- **deviceModel** (string): Device model name (default: "unknown")
- **deviceOs** (string): Operating system - "iOS", "Android", "macOS", "Windows" (default: "unknown")
- **deviceOsVersion** (string): OS version (default: "unknown")
- **deviceBrowser** (string): Browser name (default: "unknown")
- **deviceBrowserVersion** (string): Browser version (default: "unknown")
- **acceptedTerms** (boolean): Whether user accepted terms (default: false)
- **marketingOptIn** (boolean): Marketing consent (default: false)

