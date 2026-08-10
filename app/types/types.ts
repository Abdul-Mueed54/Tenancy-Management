export type TenantFormData = {
  tenantsId: string;
  fullName: string;
  contactNumber: string;
  presentAddress: string;
  cnicNumber: string;
  buildingId: string;
  buildingName: string;
  unitNumber: string;
  advanceAmount: string;
  monthlyRent: string;
  firstMonthRentCollected: string;
  rentDueDay: string;
};

export type RegisterTenantPayload = {
  fullName: string;
  contactNumber: string;
  presentAddress: string;
  cnicNumber: string;
  cnicExpiryDate: string;
  cnic_uri: string | null;
  buildingId: string;
  advanceAmount: number;
  monthlyRent: number;
  unitNumber: string;
  firstMonthRentCollected: number;
  moveInDate: string;
  rentDueDay: number;
};

export type Ledger = {
  id: string;
  agreement_id: string;
  tenant_id: string;
  entry_type: string;
  billing_month: string;
  total_payable_amount: number;
  amount_paid: number;
  amount_due: number;
  status: string;
  created_at: string;
  updated_at: string;
};

export type MiscCharge = {
  id: string;
  agreement_id: string;
  charge_type: string;
  amount: number;
  description: string | null;
  date_incurred: string;
  status: string;
  created_at?: string;
  updated_at?: string;
};