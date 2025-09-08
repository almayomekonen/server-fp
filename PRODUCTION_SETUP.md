# Production Setup Guide

## הגדרת האפליקציה לפרודקשן

### 1. הגדרת השרת (Backend)

#### Environment Variables

1. העתק את הקובץ `server/env.example` לשם `server/.env`
2. מלא את הערכים הבאים:

```bash
NODE_ENV=production
MONGO_URI=mongodb://your-mongo-connection-string
ACCESS_TOKEN_SECRET=your-very-strong-jwt-secret-key
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
PORT=5000
```

#### הפעלת השרת

```bash
cd server
npm install
npm start  # או npm run prod לפרודקשן
```

### 2. הגדרת הקליינט (Frontend)

#### Environment Variables

1. העתק את הקובץ `client/env.example` לשם `client/.env`
2. מלא את כתובת השרת:

```bash
REACT_APP_API_URL=https://your-production-server.com
```

#### בנייה והפעלה

```bash
cd client
npm install
npm run build  # יוצר build לפרודקשן בתיקיית build/
```

### 3. הגדרות אבטחה

השרת כולל:

- ✅ Helmet לאבטחת HTTP headers
- ✅ Rate limiting על login
- ✅ CORS מוגדר נכון
- ✅ Secure cookies בפרודקשן
- ✅ JWT tokens מאובטחים

### 4. הגדרות CORS

עדכן את `server/server.js` בשורה 20:

```javascript
const allowedOrigins = [
  "http://localhost:3000", // פיתוח
  "https://your-production-domain.com", // פרודקשן - החלף לכתובת האמיתית
];
```

### 5. בדיקות לפני פרסום

- [ ] ודא ש-MongoDB פועל ונגיש
- [ ] ודא שכל ה-environment variables מוגדרים
- [ ] בדק שה-CORS מאפשר את הדומיין של הקליינט
- [ ] ודא ש-HTTPS פועל (לפרודקשן)
- [ ] בדק שהמייל עובד (אם נדרש)

### 6. פריסה ב-Railway

#### הגדרת Railway:

1. **צור חשבון ב-Railway** - railway.app
2. **חבר את GitHub Repository**
3. **Railway יזהה אוטומטית** את שני השירותים (frontend + backend)
4. **הוסף Environment Variables** בלוח הבקרה של Railway:
   ```
   NODE_ENV=production
   MONGO_URI=your-mongodb-connection-string
   ACCESS_TOKEN_SECRET=your-jwt-secret
   EMAIL_USER=your-email
   EMAIL_PASS=your-email-password
   ```

#### MongoDB ב-Railway:

- **אפשרות 1**: השתמש בtemplate של MongoDB ב-Railway
- **אפשרות 2**: חבר MongoDB Atlas (מומלץ)

### 7. מעקב ולוגים

השרת כולל לוגים בסיסיים. לפרודקשן מומלץ להוסיף:

- Winston/Morgan ללוגים מתקדמים
- מעקב אחר שגיאות (Sentry)
- מעקב ביצועים
