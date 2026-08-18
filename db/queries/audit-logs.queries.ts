import { eq } from "drizzle-orm";
import { db } from "../index";
import { activity_logs, ledgers, misc_charges, tenants, agreements, buildings, payments } from "../schema";
import dayjs from "dayjs";

export type TimelineType = "finance_bill" | "finance_pay" | "log";
export type TimelineCategory = "rent" | "utility" | "misc" | "log";

export type TimelineEvent = {
  id: string;
  /** The actual moment this happened — shown as the timestamp on the row. */
  date: string;
  /**
   * "YYYY-MM" bucket this event is grouped under. For rent/utility bills and
   * their payments, this is the ledger's billing_month — NOT when the bill
   * or payment was created — so a late payment still lands under the month
   * it was actually paying for. Misc charges and logs have no billing month,
   * so they're bucketed by when they happened.
   */
  monthKey: string;
  title: string;
  desc: string;
  type: TimelineType;
  category: TimelineCategory;
  amount?: number;
};

export const getTenantSummaryTimeline = async (tenantId: string, agreementId: string) => {
  try {
    if (!tenantId || !agreementId) throw new Error("Missing params.");

    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
    const [agreement] = await db.select().from(agreements).where(eq(agreements.id, agreementId)).limit(1);

    if (!tenant || !agreement) throw new Error("Tenant or Agreement not found.");

    const [building] = await db.select().from(buildings).where(eq(buildings.id, agreement.building_id)).limit(1);

    const logs = await db.select().from(activity_logs).where(eq(activity_logs.tenant_id, tenant.id));
    const allLedgers = await db.select().from(ledgers).where(eq(ledgers.agreement_id, agreementId));
    const misc = await db.select().from(misc_charges).where(eq(misc_charges.agreement_id, agreementId));
    const allPayments = await db.select().from(payments).where(eq(payments.agreement_id, agreementId));

    const timeline: TimelineEvent[] = [];
    const now = dayjs().toISOString();
    const safeDate = (d: string | null | undefined) => d || now;
    const monthKeyOf = (d: string) => dayjs(d).format("YYYY-MM");

    // 1. System logs — bucketed by when they happened, no billing month concept.
    logs.forEach((l) => {
      const title =
        l.action_type === "STATUS_CHANGE" ? "Status Updated" :
        l.action_type === "DOCUMENT" ? "Document Added" : "System Event";
      const date = safeDate(l.created_at);

      timeline.push({
        id: `log_${l.id}`,
        date,
        monthKey: monthKeyOf(date),
        title,
        desc: l.description,
        type: "log",
        category: "log",
      });
    });

    // 2. Ledgers (rent + utility bills) and their payments — bucketed by the
    // ledger's billing_month, so a payment made in September for August's
    // rent still shows up under August.
    allLedgers.forEach((ledger) => {
      const isRent = ledger.entry_type === "rent";
      const category: TimelineCategory = isRent ? "rent" : "utility";
      const label = isRent
        ? "Rent"
        : ledger.entry_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      const billMonthKey = monthKeyOf(ledger.billing_month);
      const billDate = safeDate(ledger.created_at);

      timeline.push({
        id: `bill_${ledger.id}`,
        date: billDate,
        monthKey: billMonthKey,
        title: `${label} Bill — ${dayjs(ledger.billing_month).format("MMMM YYYY")}`,
        desc: `Total due Rs ${ledger.total_payable_amount}.`,
        type: "finance_bill",
        category,
        amount: ledger.total_payable_amount,
      });

      const ledgerPayments = allPayments
        .filter((p) => p.ledger_id === ledger.id)
        .sort((a, b) => new Date(safeDate(a.created_at)).getTime() - new Date(safeDate(b.created_at)).getTime());

      let runningTotal = 0;
      ledgerPayments.forEach((p) => {
        runningTotal += p.amount;
        const remaining = ledger.total_payable_amount - runningTotal;
        const isFullyPaid = remaining <= 0;
        const payDate = safeDate(p.created_at);

        timeline.push({
          id: `pay_${p.id}`,
          date: payDate,
          monthKey: billMonthKey, // grouped with the bill it's paying, not when it was paid
          title: `${label} Payment Received`,
          desc: isFullyPaid
            ? `Paid in full — Rs ${p.amount}.`
            : `Partial payment of Rs ${p.amount}. Rs ${remaining} remaining.`,
          type: "finance_pay",
          category,
          amount: p.amount,
        });
      });
    });

    // 3. Misc charges + settlement — no billing month field, so bucketed by
    // when the charge was raised, and its payment stays grouped with it.
    misc.forEach((m) => {
      const chargeDate = safeDate(m.created_at);
      const chargeMonthKey = monthKeyOf(chargeDate);

      timeline.push({
        id: `misc_${m.id}`,
        date: chargeDate,
        monthKey: chargeMonthKey,
        title: "Misc Charge",
        desc: `${m.charge_type} — Rs ${m.amount}.`,
        type: "finance_bill",
        category: "misc",
        amount: m.amount,
      });

      if (m.status === "paid") {
        timeline.push({
          id: `misc_pay_${m.id}`,
          date: safeDate(m.updated_at),
          monthKey: chargeMonthKey,
          title: "Misc Charge Cleared",
          desc: `Paid in full — Rs ${m.amount} for ${m.charge_type}.`,
          type: "finance_pay",
          category: "misc",
          amount: m.amount,
        });
      }
    });

    // Chronological by actual timestamp — the screen groups this by monthKey itself.
    timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      success: true as const,
      data: { tenant, agreement, building, timeline },
    };
  } catch (error) {
    console.error(error);
    return { success: false as const, data: null };
  }
};