# Security Specification - shara's

## Data Invariants
1. **MenuItem & Category**: Read-only for public. Write-only for verified Admins.
2. **Order**: 
   - Public can create an order with strict schema validation.
   - Public can track (get) an order if they know the exact document ID.
   - Public CANNOT list orders.
   - Admins can list and update order status.
   - `totalPrice` must match the sum of item prices (optional but good, though logic in rules is hard for math on lists). We will at least validate basic types.
   - `status` can only be updated by Admins.
3. **Admins**: Root admin (`mantatech77@gmail.com`) can bootstrap their own record. After that, only admins can manage the collection.

## The Dirty Dozen Payloads (Attack Vectors)

1. **MenuItem Spoofing**: Public user tries to create a free menu item.
2. **Category Deletion**: Public user tries to delete the 'Nasi & Lauk' category.
3. **Order Status Hijack**: Customer tries to confirm their own 'pending' order.
4. **Order PII Leakage**: User tries to list all orders to get other people's phone numbers.
5. **Admin Escalation**: Regular user tries to add themselves to the `admins` collection.
6. **Shadow Order Field**: User tries to inject `isConfirmed: true` into the Order payload.
7. **Invalid Price**: User tries to create an order with `totalPrice: -100`.
8. **Junk ID Poisoning**: User tries to 'get' an order with a 1MB string as ID.
9. **Status State Shortcut**: Admin tries to move an order from 'pending' to 'completed' skipping 'confirmed' (if we had strict states, but here confirm/confirmed is simple).
10. **Immutable Order Modification**: User tries to change the `deliveryDate` of an existing order.
11. **Orphaned Category Item**: User tries to create a MenuItem referencing a non-existent Category ID.
12. **System Field Injection**: User tries to set `createdAt` to a future date instead of `serverTimestamp()`.

## Test Runner (Firestore Rules Test)

```typescript
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, addDoc, collection, updateDoc } from "firebase/firestore";

let testEnv: RulesTestEnvironment;

describe("shara's Security Rules", () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: "sharas-food",
      firestore: {
        rules: fs.readFileSync("firestore.rules", "utf8"),
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  test("Public cannot write to menu_items", async () => {
    const unauthenticatedDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(addDoc(collection(unauthenticatedDb, "menu_items"), { name: "Hack", price: 0 }));
  });

  test("Public can create an order", async () => {
    const unauthenticatedDb = testEnv.unauthenticatedContext().firestore();
    await assertSucceeds(addDoc(collection(unauthenticatedDb, "orders"), {
      customerName: "Budi",
      phoneNumber: "0812",
      items: [{ itemId: "1", name: "Nasi", price: 1000, quantity: 1 }],
      totalPrice: 1000,
      status: "pending",
      createdAt: serverTimestamp()
    }));
  });

  test("Public cannot list orders", async () => {
    const unauthenticatedDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDocs(collection(unauthenticatedDb, "orders")));
  });

  test("Public can get their own order by ID", async () => {
    // This requires an existing order, or mock
  });

  test("Non-admin cannot update order status", async () => {
    const authDb = testEnv.authenticatedContext("user123").firestore();
    await assertFails(updateDoc(doc(authDb, "orders/order1"), { status: "confirmed" }));
  });

  test("Root admin can bootstrap", async () => {
    const rootAdminDb = testEnv.authenticatedContext("admin_uid", { 
      email: "mantatech77@gmail.com", 
      email_verified: true 
    }).firestore();
    await assertSucceeds(setDoc(doc(rootAdminDb, "admins/admin_uid"), { email: "mantatech77@gmail.com" }));
  });
});
```
