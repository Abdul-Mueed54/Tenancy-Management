import { eq } from 'drizzle-orm';
import { misc_charges, agreements } from '../schema'; 
import { db } from '..';

export const addMiscCharge = async (agreementId: string, chargeType: string, amount: number, description: string, dateIncurred: string) => {
  try {
    await db.insert(misc_charges).values({
      agreement_id: agreementId,
      charge_type: chargeType,
      amount: amount,
      description: description,
      date_incurred: dateIncurred,
      status: 'pending',
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to add misc charge:", error);
    return { success: false, message: "An error occurred." };
  }
};

export const markMiscChargePaid = async (chargeId: string) => {
  try {
    await db.update(misc_charges)
      .set({ status: 'paid' })
      .where(eq(misc_charges.id, chargeId));
    return { success: true };
  } catch (error) {
    console.error("Failed to mark charge as paid:", error);
    return { success: false };
  }
};

export const deleteMiscCharge = async (chargeId: string) => {
  try {
    await db.delete(misc_charges).where(eq(misc_charges.id, chargeId));
    return { success: true };
  } catch (error) {
    console.error("Failed to delete misc charge:", error);
    return { success: false };
  }
};