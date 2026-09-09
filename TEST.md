# 🔧 سیستەمی تاقی کردنی Bahman-Darwish

## گامێکی یەک - ڕۆ بۆ ڕادەی پرۆژە
```bash
cd d:\sytem app\dist\Bahman-Darwish-main\Bahman-Darwish-main
```

## گامێکی دوو - دامەزرێنە مۆدیولەکان
```bash
npm install
```

⏳ **بە چاوی ڕاست** - ئەمە 2-5 خولەک وەقت وەردەگرێت

## گامێکی سێ - کردنی سەرڤەری گەشە
```bash
npm run dev
```

✅ **دەبێت ئەمە بسڕێت**:
```
VITE v5.4.0  ready in 123 ms
➜  Local:   http://localhost:3001/
➜  press h + enter to show help
```

## گامێکی چوار - کردنی براوسەر
- رۆ بۆ: **http://localhost:3001**
- لۆگین بە ھر ئاراستە: `user / pass`
- دات و سیستەم دیار دەبێت! ✅

---

## اگەر ھیچ جار شاشەی ڕەش بێ:

### 1️⃣ تێستی npm
```bash
npm --version
```
*دەبێت نفسەر 8+ بێ*

### 2️⃣ پاک کردنی node_modules
```bash
rm -r node_modules package-lock.json
npm install
```

### 3️⃣ کردنی سەرڤەری دووبارە
```bash
npm run dev
```

### 4️⃣ بە براوسەری نوێ فتح بکە
- کلیلی **Ctrl+Shift+Delete** - پاک کردنی cache
- رۆ بۆ: **http://localhost:3001**

---

## ⚠️ اگەر هێشتوو شاشەی ڕەش بێ:

برۆ **F12** و بروسەر و دابنیسە console tabs:
- **Console** - پیشان بدەرێت چ errors
- **Network** - بچاو بچۆ آیا requests کات دەکەن

**ئا بنوسە** حەتا error message!
