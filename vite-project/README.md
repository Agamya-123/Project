```markdown
# 🧾 Pincode Management Dashboard

A modern Vue.js 3-based frontend for managing pincodes with enhanced UX, glassmorphism styling, and dynamic pagination. It supports full CRUD operations with API integration, input validation, and loader overlays.

---

## ✨ Features

- ✅ Add, edit, and delete pincode rules
- 🔄 Inline editing with instant save support
- 💎 Glassmorphism UI: clean, modern, and elegant
- 📦 Pagination with adjustable page sizes
- 🚦 Loader overlay for async operations
- 📋 Validates Indian 6-digit pincodes
- 🧠 Smart value rendering based on `ruleType`

---

## 🧩 Tech Stack

- **Framework:** Vue.js 3 (Composition API)
- **HTTP Client:** Axios
- **Styling:** Scoped CSS with glassmorphism
- **State:** Local reactive state (no Vuex)

---

## 📂 Project Structure



.
├── src/
│   ├── components/
│   │   └── PincodeManager.vue  # Main UI component
│   └── ...
├── public/
│   └── index.html
├── README.md
└── ...



---

## 🚀 Getting Started

### 1. Clone the Repo

```bash
git clone https://github.com/Agamya-123/Project
cd vite-project
````

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the App

```bash
npm run dev
```

Open your browser at `http://localhost:5173` (or as indicated in terminal).

---

## 📡 API Configuration

The component makes a request like this:

```http
GET /api/v1/checkoutrules?pincode=457777
```

With required header:

```json
{
  "x-application-data": {
    "company_id": "17",
    "_id": "65f437fae78851028707daee",
    "applicationId": "65f437fae78851028707daee"
  }
}
```

Change the header or pincode in `onMounted()` in the component if needed.

---

## 🛠 Customization

* Style updates: check `<style scoped>` section in the component
* Modify logic inside:

  * `handleRuleTypeChange()`
  * `saveRow()`
  * `saveNewRow()`

---


## 📝 License

MIT © 2025 \Agamya Rathour

```

---

You can paste this directly into your `README.md` file. Let me know if you'd like a Markdown badge section or GitHub Actions CI/CD badges added as well.
```
