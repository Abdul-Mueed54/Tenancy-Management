import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "..";
import { activity_logs, agreements, buildings, ledgers, tenants } from "../schema";
import dayjs from "dayjs";

interface RenewalPayload {
  oldAgreementId: string;
  tenantId: string;
  buildingId: string;
  unitNumber: string;
  moveInDate: string;
  advanceAmount: number;
  rentDueDay: number;
  newMonthlyRent: number;
  newStartDate: string; // YYYY-MM-DD
  attachmentUri: string | null;
}

export const uploadAgreementDetails = async ( agreementId: string, tenantId: string, fileUri: string, startDate: string ) => {
  try {
    await db.transaction(async (tx) => {

      const endDate = dayjs(startDate).add(11, 'month').format('YYYY-MM-DD');
      await tx.update(agreements)
        .set({
          attachment_uri: fileUri,
          start_date: startDate,
          end_date: endDate
        })
        .where(eq(agreements.id, agreementId));

      await tx.insert(activity_logs).values({
        tenant_id: tenantId,
        action_type: 'DOCUMENT',
        description: `Official agreement document uploaded (Contract Start: ${startDate}).`,
      });
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to upload agreement:", error);
    return { success: false };
  }
};

// Fetch active agreements expiring within a specific number of days (default 30)
export const getExpiringAgreements = async (daysLimit = 30) => {
  try {
    const today = dayjs().format('YYYY-MM-DD');
    const targetDate = dayjs().add(daysLimit, 'day').format('YYYY-MM-DD');

    const result = await db
      .select({
        agreementId: agreements.id,
        tenantId: tenants.id,
        tenantName: tenants.name,
        contactNumber: tenants.contact_no,
        buildingName: buildings.name,
        unitNumber: agreements.unit_number,
        endDate: agreements.end_date,
      })
      .from(agreements)
      .innerJoin(tenants, eq(agreements.tenant_id, tenants.id))
      .innerJoin(buildings, eq(agreements.building_id, buildings.id))
      .where(
        and(
          eq(agreements.is_active, true),
          gte(agreements.end_date, today),       // Expiration is today or later
          lte(agreements.end_date, targetDate)   // Expiration is before our target date
        )
      );

    // Sort so the ones expiring soonest are at the top
    result.sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());

    return { success: true, data: result };
  } catch (error) {
    console.error("Error fetching expiring agreements:", error);
    return { success: false, data: [] };
  }
};


export const processLeaseRenewal = async (data: RenewalPayload) => {
  try {
    await db.transaction(async (tx) => {
      // Archive the old agreement
      await tx.update(agreements)
        .set({ is_active: false })
        .where(eq(agreements.id, data.oldAgreementId));

      const newEndDate = dayjs(data.newStartDate).add(11, 'month').format('YYYY-MM-DD');

      const [newAgreement] = await tx.insert(agreements).values({
        tenant_id: data.tenantId,
        building_id: data.buildingId,
        unit_number: data.unitNumber,
        move_in_date: data.moveInDate,
        start_date: data.newStartDate,
        end_date: newEndDate,
        monthly_rent: data.newMonthlyRent,
        advance_amount: data.advanceAmount,
        attachment_uri: data.attachmentUri,
        rent_due_day: data.rentDueDay,
        is_active: true,
      }).returning({ id: agreements.id });

      const billingMonth = dayjs(data.newStartDate).format('YYYY-MM');
      await tx.insert(ledgers).values({
        tenant_id: data.tenantId,
        agreement_id: newAgreement.id,
        entry_type: 'rent',
        billing_month: billingMonth,
        total_payable_amount: data.newMonthlyRent,
        amount_paid: 0,
        amount_due: data.newMonthlyRent,
        status: 'pending',
      });

      await tx.insert(activity_logs).values({
        tenant_id: data.tenantId,
        action_type: 'RENEWAL',
        description: `Lease renewed for Unit ${data.unitNumber}. Rent updated to Rs ${data.newMonthlyRent}.`,
      });
    });

    return { success: true };
  } catch (error) {
    console.error("Renewal transaction failed:", error);
    return { success: false, error };
  }
};

export const getAgreementForRenewal = async (agreementId: string) => {
  try {
    const result = await db
      .select({
        agreementId: agreements.id,
        tenantId: agreements.tenant_id,
        buildingId: agreements.building_id,
        unitNumber: agreements.unit_number,
        monthlyRent: agreements.monthly_rent,
        advanceAmount: agreements.advance_amount,
        moveInDate: agreements.move_in_date,
        rentDueDay: agreements.rent_due_day,
        tenantName: tenants.name,
      })
      .from(agreements)
      .innerJoin(tenants, eq(agreements.tenant_id, tenants.id))
      .where(eq(agreements.id, agreementId))
      .limit(1);

    return { success: true, data: result[0] };
  } catch (error) {
    console.error("Error fetching agreement for renewal:", error);
    return { success: false, data: null };
  }
};

export const getArchivedTenants = async () => {
  try {
    const result = await db
      .select({
        id: agreements.id,
        tenantId: agreements.tenant_id,
        tenantName: tenants.name,
        buildingName: buildings.name,
        unitNumber: agreements.unit_number,
        startDate: agreements.start_date,
        endDate: agreements.end_date,
        monthlyRent: agreements.monthly_rent,
      })
      .from(agreements)
      .innerJoin(tenants, eq(agreements.tenant_id, tenants.id))
      .innerJoin(buildings, eq(agreements.building_id, buildings.id))
      .where(eq(tenants.is_active, false))
      .orderBy(desc(agreements.end_date)); // Shows the most recently ended leases first

    return { success: true, data: result };
  } catch (error) {
    console.error("Error fetching archived agreements:", error);
    return { success: false, data: [] };
  }
};

export const getTenantAgreementHistory = async (tenantId: string) => {
  try {
    const result = await db
      .select({
        id: agreements.id,
        buildingName: buildings.name,
        unitNumber: agreements.unit_number,
        startDate: agreements.start_date,
        endDate: agreements.end_date,
        monthlyRent: agreements.monthly_rent,
        advanceAmount: agreements.advance_amount,
        isActive: agreements.is_active,
        attachmentUri: agreements.attachment_uri,
      })
      .from(agreements)
      .innerJoin(buildings, eq(agreements.building_id, buildings.id))
      .where(eq(agreements.tenant_id, tenantId))
      .orderBy(desc(agreements.start_date));

    return { success: true, data: result };
  } catch (error) {
    console.error("Error fetching tenant lease history:", error);
    return { success: false, data: [] };
  }
};