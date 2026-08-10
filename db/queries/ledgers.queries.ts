import { desc, eq } from "drizzle-orm";
import { db } from "..";
import { ledgers, misc_charges } from "../schema";

export const getFinancialHistory = async (agreementId: string) => {
  try {
    // Fetch Rent Ledgers
    const rentLedgers = await db
      .select()
      .from(ledgers)
      .where(eq(ledgers.agreement_id, agreementId))
      .orderBy(desc(ledgers.created_at));

    // Fetch Misc Charges
    const miscCharges = await db
      .select()
      .from(misc_charges)
      .where(eq(misc_charges.agreement_id, agreementId))
      .orderBy(desc(misc_charges.created_at));

    return {
      success: true,
      data: {
        rentLedgers,
        miscCharges
      }
    };
  } catch (error) {
    console.error("Error fetching finances:", error);
    return { success: false, data: null };
  }
};

export const processLedgerPayment = async (ledgerId: string, paymentAmount: number) => {
  try {
    await db.transaction(async (tx) => {
      // 1. Fetch current ledger stats
      const [currentLedger] = await tx
        .select()
        .from(ledgers)
        .where(eq(ledgers.id, ledgerId))
        .limit(1);

      if (!currentLedger) throw new Error("Ledger not found");

      // 2. Calculate new totals
      const newAmountPaid = currentLedger.amount_paid + paymentAmount;
      const newAmountDue = currentLedger.total_payable_amount - newAmountPaid;

      // 3. Determine new status
      let newStatus = 'pending';
      if (newAmountDue <= 0) {
        newStatus = 'paid';
      } else if (newAmountPaid > 0) {
        newStatus = 'partial';
      }

      // 4. Update the record
      await tx.update(ledgers)
        .set({
          amount_paid: newAmountPaid,
          amount_due: Math.max(0, newAmountDue), // Prevents negative due amounts
          status: newStatus
        })
        .where(eq(ledgers.id, ledgerId));
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to process payment:", error);
    return { success: false };
  }
};