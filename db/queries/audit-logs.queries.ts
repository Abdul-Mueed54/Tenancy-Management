import { eq } from "drizzle-orm";
import { db } from "../index";
import { activity_logs, ledgers, payments, misc_charges, tenants, agreements, buildings } from "../schema";
import dayjs from "dayjs";

export const getTenantSummaryTimeline = async (tenantId: string, agreementId: string) => {
  try {
    if (!tenantId || !agreementId) throw new Error("Missing params.");

    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
    const [agreement] = await db.select().from(agreements).where(eq(agreements.id, agreementId)).limit(1);
    const [building] = await db.select().from(buildings).where(eq(buildings.id, agreement.building_id)).limit(1);

    if (!tenant || !agreement) throw new Error("Tenant or Agreement not found.");

    const logs = await db.select().from(activity_logs).where(eq(activity_logs.tenant_id, tenant.id));
    const allLedgers = await db.select().from(ledgers).where(eq(ledgers.agreement_id, agreementId));
    const misc = await db.select().from(misc_charges).where(eq(misc_charges.agreement_id, agreementId));

    // NEW: Fetch actual payments!
    const allPayments = await db.select().from(payments).where(eq(payments.agreement_id, agreementId));

    const getSafeDate = (dateStr: string | null | undefined, fallback: string) => dateStr || fallback;

    const rentHistory: any[] = [];
    const utilityHistory: any[] = [];
    const miscHistory: any[] = [];
    const systemLogs: any[] = [];

    // 1. Map System Logs (Diary)
    logs.forEach(l => {
      let friendlyTitle = l.action_type === 'STATUS_CHANGE' ? 'Status Updated' :
                          l.action_type === 'DOCUMENT' ? 'Document Added' : 'System Event';
      systemLogs.push({ id: `log_${l.id}`, date: getSafeDate(l.created_at, dayjs().toISOString()), title: friendlyTitle, desc: l.description, type: 'log' });
    });

    // 2. Map Ledger Generations (Bills)
    allLedgers.forEach(r => {
      const isRent = r.entry_type === 'rent';
      const targetArray = isRent ? rentHistory : utilityHistory;
      const typeName = isRent ? 'Rent' : r.entry_type.replace('_', ' ');
      const capitalizedType = typeName.charAt(0).toUpperCase() + typeName.slice(1);

      targetArray.push({
        id: `bill_gen_${r.id}`,
        date: getSafeDate(r.created_at, dayjs().toISOString()),
        title: `${capitalizedType} Billed`,
        desc: `A ${typeName} bill of Rs ${r.total_payable_amount} was generated for ${dayjs(r.billing_month).format('MMMM YYYY')}.`,
        type: 'finance_bill'
      });
    });

    // 3. Map Misc Charge Generations
    misc.forEach(m => {
      miscHistory.push({
        id: `misc_gen_${m.id}`,
        date: getSafeDate(m.created_at, dayjs().toISOString()),
        title: 'Additional Charge Added',
        desc: `A charge of Rs ${m.amount} was added for ${m.charge_type}. ${m.description || ''}`.trim(),
        type: 'finance_bill'
      });
    });

    // 4. NEW: Map the actual, permanent Payments!
    allPayments.forEach(p => {
      // If it has a ledger_id, it's Rent or Utility
      if (p.ledger_id) {
        const linkedLedger = allLedgers.find(l => l.id === p.ledger_id);
        if (linkedLedger) {
          const isRent = linkedLedger.entry_type === 'rent';
          const targetArray = isRent ? rentHistory : utilityHistory;
          const typeName = isRent ? 'Rent' : linkedLedger.entry_type.replace('_', ' ');

          targetArray.push({
            id: `pay_${p.id}`,
            date: getSafeDate(p.created_at, dayjs().toISOString()),
            title: `${typeName.charAt(0).toUpperCase() + typeName.slice(1)} Payment Received`,
            desc: `Received a payment of Rs ${p.amount} via ${p.payment_method}.`,
            type: 'finance_pay'
          });
        }
      } else {
        // If it doesn't have a ledger_id, it's a Misc Charge payment
        miscHistory.push({
          id: `pay_${p.id}`,
          date: getSafeDate(p.created_at, dayjs().toISOString()),
          title: 'Charge Cleared',
          desc: `Received a payment of Rs ${p.amount} via ${p.payment_method}.`,
          type: 'finance_pay'
        });
      }
    });

    // Sort all arrays chronologically (newest first)
    const sorter = (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime();
    rentHistory.sort(sorter);
    utilityHistory.sort(sorter);
    miscHistory.sort(sorter);
    systemLogs.sort(sorter);

    return {
      success: true,
      data: { tenant, agreement, rentHistory, building, utilityHistory, miscHistory, systemLogs }
    };
  } catch (error) {
    console.error(error);
    return { success: false, data: null };
  }
};