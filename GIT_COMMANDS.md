# Git Commands - העלאה ל-GitHub

## שלב 1: אתחול Git (אם עדיין לא נעשה)
```bash
git init
```

## שלב 2: הוספת כל הקבצים
```bash
git add .
```

## שלב 3: Commit ראשון
```bash
git commit -m "Initial commit - Spark Personal OS with Quotes, Performance & Sync"
```

## שלב 4: חיבור ל-Repository שלך
```bash
git remote add origin https://github.com/amitA51/spark_oslife.git
```

## שלב 5: שינוי שם ה-branch ל-main
```bash
git branch -M main
```

## שלב 6: העלאה ל-GitHub
```bash
git push -u origin main
```

---

## אם יש שגיאה "remote origin already exists":
```bash
git remote remove origin
git remote add origin https://github.com/amitA51/spark_oslife.git
git push -u origin main
```

---

## בדיקה שהכל עבד:
לאחר ההעלאה, גש ל:
https://github.com/amitA51/spark_oslife

אמור לראות את כל הקבצים שם!

---

## הצעד הבא - Vercel:
1. גש ל: https://vercel.com/new
2. Import את spark_oslife repository
3. הוסף Environment Variable:
   - Name: `GEMINI_API_KEY`
   - Value: המפתח שלך מ-.env.local
4. Deploy!
