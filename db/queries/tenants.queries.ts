import { RegisterTenantPayload } from "@/types/types";
import dayjs from "dayjs";
import { and, desc, eq } from "drizzle-orm";
import { db } from "..";
import { activity_logs, agreements, ledgers, tenants } from "../schema";

// Add new tenant
export const registerNewTenant = async (data: RegisterTenantPayload) => {
  try {
    await db.transaction(async (tx) => {
      const [newTenant] = await tx
        .insert(tenants)
        .values({
          cnic_number: data.cnicNumber,
          name: data.fullName,
          contact_no: data.contactNumber,
          permanent_address: data.presentAddress,
          cnic_expiry_date: data.cnicExpiryDate,
          cnic_uri: data.cnic_uri,
        })
        .returning({ id: tenants.id });

      const endDate = dayjs(data.moveInDate)
        .add(11, "month")
        .format("YYYY-MM-DD");

      const [newAgreement] = await tx
        .insert(agreements)
        .values({
          tenant_id: newTenant.id,
          building_id: data.buildingId, // Make sure your frontend payload passes the building's UUID
          unit_number: data.unitNumber,
          move_in_date: data.moveInDate,
          start_date: data.moveInDate,
          end_date: endDate,
          advance_amount: data.advanceAmount,
          monthly_rent: data.monthlyRent,
          rent_due_day: data.rentDueDay,
          is_active: true,
        })
        .returning({ id: agreements.id });

      const amountDue = data.monthlyRent - data.firstMonthRentCollected;
      let status = "pending";
      if (amountDue <= 0) status = "paid";
      else if (data.firstMonthRentCollected > 0) status = "partial";

      const billingMonth = dayjs(data.moveInDate).format("YYYY-MM");

      await tx.insert(ledgers).values({
        tenant_id: newTenant.id,
        agreement_id: newAgreement.id,
        entry_type: "rent",
        billing_month: billingMonth,
        total_payable_amount: data.monthlyRent,
        amount_paid: data.firstMonthRentCollected,
        amount_due: amountDue > 0 ? amountDue : 0,
        status: status,
      });

      await tx.insert(activity_logs).values({
        tenant_id: newTenant.id,
        action_type: "SYSTEM",
        description: `Tenant profile created and keys handed over (Move-in: ${data.moveInDate}).`,
      });
    });

    return { success: true };
  } catch (error) {
    console.error("Transaction failed:", error);
    return { success: false, error };
  }
};

export const getTenantsByBuilding = async (buildingId: string) => {
  try {
    const result = await db
      .select({
        id: tenants.id,
        cnic: tenants.cnic_number,
        name: tenants.name,
        contact: tenants.contact_no,
        rentAmount: agreements.monthly_rent,
        isActive: agreements.is_active,
      })
      .from(agreements)
      .innerJoin(tenants, eq(agreements.tenant_id, tenants.id))
      .where(
        and(
          eq(agreements.building_id, buildingId),
          eq(agreements.is_active, true),
        ),
      );

    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to fetch building tenants:", error);
    return { success: false, data: [] };
  }
};

export const getFullTenantDetails = async (tenantId: string) => {
  try {
    const result = await db
      .select({
        tenant: tenants,
        agreement: agreements,
      })
      .from(tenants)
      .innerJoin(agreements, eq(tenants.id, agreements.tenant_id))
      .where(eq(tenants.id, tenantId))
      .orderBy(desc(agreements.start_date)) // fetching on the basis of start date so that we can get the most recent (active) one, so we can ultimately use the same fuction for archived and active both tenants. Also it will help us to show onl one div for one tenant in showcase.
      .limit(1);

    return { success: true, data: result.length > 0 ? result[0] : null };
  } catch (error) {
    console.error("Error fetching full tenant details:", error);
    return { success: false, data: null };
  }
};

export const toggleTenantStatus = async (
  agreementId: string,
  currentStatus: boolean,
  tenantId: string,
) => {
  try {
    await db.transaction(async (tx) => {
      const newStatus = !currentStatus;

      await tx
        .update(agreements)
        .set({ is_active: newStatus })
        .where(eq(agreements.id, agreementId));

      await tx
        .update(tenants)
        .set({ is_active: newStatus })
        .where(eq(tenants.id, tenantId));

      await tx.insert(activity_logs).values({
        tenant_id: tenantId,
        action_type: "STATUS_CHANGE",
        description: `Tenant was ${newStatus ? "reactivated" : "deactivated (marked as moved out)"}.`,
      });
    });
    return { success: true };
  } catch (error) {
    console.error("Error toggling status:", error);
    return { success: false };
  }
};

// Update the Tenant and Agreement (Updated to use UUID)
export const updateExistingTenant = async (tenantId: string, data: any) => {
  try {
    await db.transaction(async (tx) => {
      await tx
        .update(tenants)
        .set({
          cnic_number: data.cnicNumber,
          name: data.fullName,
          contact_no: data.contactNumber,
          permanent_address: data.presentAddress,
          cnic_expiry_date: data.cnicExpiryDate,
          cnic_uri: data.cnic_uri,
        })
        .where(eq(tenants.id, tenantId));

      await tx
        .update(agreements)
        .set({
          building_id: data.buildingId,
          unit_number: data.unitNumber,
          advance_amount: data.advanceAmount,
          monthly_rent: data.monthlyRent,
          rent_due_day: data.rentDueDay,
        })
        .where(eq(agreements.tenant_id, tenantId));
    });

    return { success: true };
  } catch (error) {
    console.error("Update failed:", error);
    return { success: false, error };
  }
};
