import { and, desc, eq } from "drizzle-orm";
import { db } from "..";
import { agreements, ledgers, misc_charges } from "../schema";
import dayjs from "dayjs";

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
      const [currentLedger] = await tx
        .select()
        .from(ledgers)
        .where(eq(ledgers.id, ledgerId))
        .limit(1);

      if (!currentLedger) throw new Error("Ledger not found");

      const newAmountPaid = currentLedger.amount_paid + paymentAmount;
      const newAmountDue = currentLedger.total_payable_amount - newAmountPaid;

      let newStatus = 'pending';
      if (newAmountDue <= 0) {
        newStatus = 'paid';
      } else if (newAmountPaid > 0) {
        newStatus = 'partial';
      }

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

export const syncMonthlyRentLedgers = async () => {
  try {
    const currentMonth = dayjs().format('YYYY-MM');
    const activeAgreements = await db
      .select({
        id: agreements.id,
        tenant_id: agreements.tenant_id,
        monthly_rent: agreements.monthly_rent,
      })
      .from(agreements)
      .where(eq(agreements.is_active, true));

    if (activeAgreements.length === 0) return { success: true, message: 'No active agreements.' };

    const existingLedgers = await db
      .select({ agreement_id: ledgers.agreement_id })
      .from(ledgers)
      .where(
        and(
          eq(ledgers.entry_type, 'rent'),
          eq(ledgers.billing_month, currentMonth)
        )
      );

    const billedAgreementIds = new Set(existingLedgers.map((l) => l.agreement_id));
    const missingBills = activeAgreements.filter(
      (agreement) => !billedAgreementIds.has(agreement.id)
    );

    if (missingBills.length === 0) return { success: true, message: 'All up to date.' };

    const newLedgersToInsert = missingBills.map((agreement) => ({
      agreement_id: agreement.id,
      tenant_id: agreement.tenant_id,
      entry_type: 'rent',
      billing_month: currentMonth,
      total_payable_amount: agreement.monthly_rent,
      amount_due: agreement.monthly_rent,
      amount_paid: 0,
      status: 'pending',
    }));

    await db.insert(ledgers).values(newLedgersToInsert);

    return { success: true, generatedCount: newLedgersToInsert.length };
  } catch (error) {
    console.error("Failed to sync monthly rent:", error);
    return { success: false, error };
  }
};