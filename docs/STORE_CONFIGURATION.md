# 🏪 Store Configuration Guide

To ensure the Luno Pro features work correctly in production, you must configure the following products in both the **Apple App Store Connect** and **Google Play Console** using the exact IDs defined in the codebase.

---

## 🍏 Apple App Store Connect

### 1. Auto-Renewable Subscriptions
Go to **Subscriptions** → **Subscription Groups** (Create a group called "Pro").

| Product Name | Product ID | Type | Duration |
| :--- | :--- | :--- | :--- |
| **Luno Monthly** | `com.luno.monthly` | Auto-Renewable | 1 Month |
| **Luno Yearly** | `com.luno.yearly` | Auto-Renewable | 1 Year |

> [!TIP]
> **Free Trial**: You can configure a 14-day free trial directly in the App Store Connect pricing settings for these subscriptions.

### 2. In-App Purchase (Lifetime)
Go to **In-App Purchases** → **Manage**.

| Product Name | Product ID | Type |
| :--- | :--- | :--- |
| **Luno Lifetime** | `com.luno.lifetime` | **Non-Consumable** |

---

## 🤖 Google Play Console

### 1. Subscriptions
Go to **Monetize** → **Products** → **Subscriptions**.

| Subscription Name | Product ID | Base Plan ID | Type |
| :--- | :--- | :--- | :--- |
| **Luno Monthly** | `luno_monthly` | `monthly-plan` | Auto-Renewing |
| **Luno Yearly** | `luno_yearly` | `yearly-plan` | Auto-Renewing |

> [!IMPORTANT]
> Ensure the **Base Plan ID** is active. You can add a 14-day "Free Trial" offer to these base plans in the "Offers" section.

### 2. In-App Products (Lifetime)
Go to **Monetize** → **Products** → **In-app products**.

| Product Name | Product ID | Type |
| :--- | :--- | :--- |
| **Luno Lifetime** | `luno_lifetime` | **One-time product** |

---

## 📝 Production Metadata & Marketing Copy

Use these descriptions to provide a consistent, professional experience on your store listings.

### App Store / Play Store Long Description
```text
Unlock absolute clarity over your wealth with Luno Pro.

Designed for those who demand precision, Luno Pro evolves your standard dashboard into a high-performance financial command center. Understand not just what you spend, but how long your capital will last.

PRO FEATURES:
- ABSOLUTE RUNWAY: Know exactly how many days of financial freedom you have left based on your current burn.
- BURN ANALYTICS: Detect long-term trends and spending anomalies with depth.
- UNIVERSAL FILTERS: Instantly window your data: 7D, 30D, 90D, and All-Time views.
- CAPITAL DISTRIBUTION: Precision-engineered category breakdowns.
- DELTA COMPARISON: High-level monthly performance vs. your historical record.

Your data never leaves your device. Luno is offline-first, private by design, and built for performance.
```

### Plan Benefits (Short)
| Plan | Store Benefit Summary |
| :--- | :--- |
| **Monthly** | Flexible monthly access to all Pro features. |
| **Yearly** | Save 33% on full access. Billed annually. |
| **Lifetime** | Pay once, own Pro forever. Early access pricing. |

---

## 🛠️ Developer Verification
The app uses the following logic to differentiate between purchase types:

```typescript
// Unified Request Mapping
await IAP.requestPurchase({
  request: {
    apple: { sku },
    google: { skus: [sku] }
  },
  type: sku === SKU_LIFETIME ? 'in-app' : 'subs'
});
```

> [!CAUTION]
> **Production Testing**: To test these products before launch, you must use **Sandbox Testers** (iOS) or **License Testers** (Android) and run the app via an `eas build --profile development` dev client.
