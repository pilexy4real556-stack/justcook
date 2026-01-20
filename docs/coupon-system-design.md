# Referral System Implementation Plan

## System Requirements

### Flow Overview

1. **First Order**: Customer places first order → Gets referral code after payment → Code displayed on success page
2. **Code Sharing**: Customer shares code with friend/family
3. **Code Redemption**: When friend uses the code:
   - Friend pays **normal delivery fee** (no discount)
   - Friend gets their **own referral code** after payment (for first order only)
   - The person who shared the code gets **free delivery credit** for their **NEXT order**
4. **One-Time Use**: Each referral code can only be used **once**, by **one person**

---

## Current State Analysis

### ✅ What's Working

1. **Code Generation**: `ensureReferralCode()` generates code on first order (in webhook)
2. **Code Display**: Success page shows referral code
3. **Code Validation**: `/api/referral/validate` validates codes before checkout
4. **Free Delivery Credits**: System tracks `freeDeliveryCredits` per user
5. **Credit Consumption**: Credits are consumed when user has them (in checkout)

### ❌ What's Broken/Missing

#### 1. **Referral Code Lookup Issue**

- `applyReferralCode()` in `services/referral.js` looks in `/referrals` collection
- But codes are stored in `/users/{customerId}/referralCode`
- **Fix**: Update `applyReferralCode()` to look in users collection

#### 2. **One-Time Use Not Enforced**

- No tracking of which codes have been used
- Same code can potentially be used multiple times
- **Fix**: Track code usage in database

#### 3. **Referral Application Timing**

- Currently applies referral at checkout time (in `checkout.js`)
- Should only **validate** at checkout, **apply** at webhook time
- **Fix**: Move referral application to webhook handler

#### 4. **Free Delivery for New User (INCORRECT)**

- ~~New user should get free delivery immediately when using code~~ ❌
- **CORRECT**: New user pays normal delivery fee
- Only referrer gets free delivery credit for next order
- **Fix**: Remove free delivery application for new user

---

## Database Schema

### User Document (`/users/{customerId}`)

```typescript
{
  referralCode: "JC-ABC12",           // Their code to share
  referralCodeUsed: false,             // Has their code been used?
  referralCodeUsedBy: null,            // customerId who used it
  referralCodeUsedAt: null,           // Timestamp when used
  referredBy: null,                   // customerId who referred them (if any)
  referralUsedAt: null,               // When they used a referral code
  freeDeliveryCredits: 0,              // Credits for future orders
  // ... other fields
}
```

### Order Document (`/orders/{orderId}`)

```typescript
{
  customerId: "...",
  referralCodeUsed: "JC-ABC12",       // Code used in this order (if any)
  referrerId: "...",                  // Who shared the code (if any)
  // ... other fields
}
```

---

## Implementation Plan

### Phase 1: Fix Referral Code Lookup

**File: `justcook-backend/services/referral.js`**

Update `applyReferralCode()` function to look in users collection and remove free delivery for new user.

### Phase 2: Update Validation Endpoint

**File: `justcook-backend/routes/referral.js`**

Add code usage check in validation.

### Phase 3: Fix Checkout Flow

**File: `justcook-backend/routes/checkout.js`**

Remove referral application (only validate), and don't apply free delivery for new user.

### Phase 4: Fix Webhook Handler

**File: `justcook-backend/routes/webhook.js`**

Apply referral logic properly, mark codes as used, only give credit to referrer.

### Phase 5: Frontend Updates

**File: `justcook/app/(customer)/cart/page.tsx`**

Load pending referral code from localStorage.

---

## Flow Summary

### When Friend Uses Code

1. Friend enters referral code → Code validates
2. Friend pays **normal delivery fee** (no discount)
3. Friend completes order → Payment succeeds
4. Webhook processes:
   - Code is marked as used
   - Friend is marked as referred
   - Friend gets their own referral code (first order only)
   - **Referrer gets free delivery credit for next order**
5. Friend does **NOT** get free delivery credit

### When Referrer Uses Their Credit

1. Referrer has `freeDeliveryCredits > 0`
2. At checkout, delivery fee is set to 0
3. After payment, credit is consumed (decremented)

---

## Testing Checklist

### Test Case 1: First Order

- [ ] Customer places first order
- [ ] Payment succeeds
- [ ] Referral code is generated
- [ ] Code is displayed on success page
- [ ] Code is unique

### Test Case 2: Code Sharing

- [ ] Customer shares code with friend
- [ ] Friend visits site with `?ref=CODE` in URL
- [ ] Code is stored in localStorage
- [ ] Code appears in cart referral input

### Test Case 3: Code Redemption

- [ ] Friend enters referral code in cart
- [ ] Code validates successfully
- [ ] Friend pays **normal delivery fee** (no discount)
- [ ] Friend completes order
- [ ] Referrer gets free delivery credit
- [ ] Code is marked as used
- [ ] Code cannot be used again
- [ ] Friend gets their own code after first order

### Test Case 4: Self-Referral Prevention

- [ ] Customer tries to use their own code
- [ ] Validation fails with "SELF_REFERRAL" error

### Test Case 5: Already Used Code

- [ ] Customer tries to use a code that's already been used
- [ ] Validation fails with "CODE_ALREADY_USED" error

### Test Case 6: Multiple Referral Attempts

- [ ] Customer tries to use a second referral code
- [ ] Validation fails with "ALREADY_REFERRED" error

### Test Case 7: Referrer Uses Credit

- [ ] Referrer has free delivery credit
- [ ] Referrer places order
- [ ] Delivery fee is set to 0 at checkout
- [ ] After payment, credit is consumed

---

## Key Points

✅ **Friend pays normal delivery fee** - No discount for new user  
✅ **Only referrer gets free delivery** - Credit for next order  
✅ **One-time use** - Code marked as used after redemption  
✅ **Code generation** - Only on first order  
✅ **Self-referral prevention** - Cannot use own code  
✅ **Already used prevention** - Cannot use code twice  

---

*Last updated: 2024*
