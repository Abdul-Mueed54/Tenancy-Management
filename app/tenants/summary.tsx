import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { getTenantSummaryTimeline } from '@/db/queries/audit-logs.queries';
import type { TimelineEvent, TimelineCategory } from '@/db/queries/audit-logs.queries';
import * as Print from 'expo-print';
import dayjs from 'dayjs';
import { CustomSelect } from '@/components/ui/select';

const CATEGORY_LABEL: Record<TimelineCategory, string> = {
  rent: 'Rent',
  utility: 'Utility Bills',
  misc: 'Misc Charges',
  log: 'Activity',
};

const CATEGORY_ORDER: TimelineCategory[] = ['rent', 'utility', 'misc', 'log'];

type MonthGroup = {
  key: string;
  label: string;
  byCategory: Partial<Record<TimelineCategory, TimelineEvent[]>>;
};

function groupByMonth(timeline: TimelineEvent[]): MonthGroup[] {
  const map = new Map<string, MonthGroup>();

  timeline.forEach((event) => {
    const key = event.monthKey;
    if (!map.has(key)) {
      map.set(key, { key, label: dayjs(`${key}-01`).format('MMMM YYYY'), byCategory: {} });
    }
    const group = map.get(key)!;
    const bucket = group.byCategory[event.category] ?? (group.byCategory[event.category] = []);
    bucket.push(event);
  });

  map.forEach((group) => {
    Object.values(group.byCategory).forEach((events) => {
      events?.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });
  });

  return Array.from(map.values()).sort((a, b) => (a.key < b.key ? 1 : -1));
}

function getEventStyle(type: TimelineEvent['type']) {
  if (type === 'finance_pay') return { icon: 'checkmark-circle' as const, color: '#16a34a' };
  if (type === 'finance_bill') return { icon: 'document-text' as const, color: '#b45309' };
  return { icon: 'information-circle' as const, color: '#64748b' };
}

export default function TenantSummaryScreen() {
  const { tenantId, agreementId, name } = useLocalSearchParams<{ tenantId: string; agreementId: string; name: string }>();

  const [tenantInfo, setTenantInfo] = useState<any>(null);
  const [agreementInfo, setAgreementInfo] = useState<any>(null);
  const [buildingInfo, setBuildingInfo] = useState<any>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);

  useEffect(() => {
    const fetchTimeline = async () => {
      if (tenantId && agreementId) {
        const result = await getTenantSummaryTimeline(tenantId, agreementId);
        if (result.success && result.data) {
          setTenantInfo(result.data.tenant);
          setAgreementInfo(result.data.agreement);
          setBuildingInfo(result.data.building);
          setTimeline(result.data.timeline);
        }
      }
      setIsLoading(false);
    };
    fetchTimeline();
  }, [tenantId, agreementId]);

  const relevantEvents = useMemo(() => timeline.filter((e) => e.type !== 'finance_bill'), [timeline]);
  const months = useMemo(() => groupByMonth(relevantEvents), [relevantEvents]);

  useEffect(() => {
    if (months.length > 0 && !months.some((m) => m.key === selectedMonthKey)) {
      setSelectedMonthKey(months[0].key);
    }
  }, [months, selectedMonthKey]);

  const selectedMonth = months.find((m) => m.key === selectedMonthKey) ?? null;

  // We map your months array into the precise { label, value } format your CustomSelect demands
  const monthOptions = useMemo(() => {
    return months.map(m => ({ label: m.label, value: m.key }));
  }, [months]);

  const handleDownloadPDF = async () => {
    try {
      if (!tenantInfo || !agreementInfo) return;

      const renderEvent = (event: TimelineEvent) => `
        <div class="event-row">
          <div class="date-col">${dayjs(event.date).format('MMM D')}<br/><span class="time">${dayjs(event.date).format('h:mm A')}</span></div>
          <div class="content-col">
            <p class="event-title">${event.title}</p>
            <p class="event-desc">${event.desc}</p>
          </div>
          ${event.amount != null ? `<div class="amount-col">Rs ${event.amount}</div>` : ''}
        </div>`;

      const renderMonth = (month: MonthGroup) => `
        <div class="month-section">
          <h2 class="month-title">${month.label}</h2>
          ${CATEGORY_ORDER.filter((c) => month.byCategory[c]?.length)
            .map(
              (c) => `
            <div class="category-block">
              <h3 class="category-title">${CATEGORY_LABEL[c]}</h3>
              ${month.byCategory[c]!.map(renderEvent).join('')}
            </div>`
            )
            .join('')}
        </div>`;

      const htmlContent = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #1f2937; }
              .header { text-align: center; margin-bottom: 28px; }
              .title { font-size: 24px; font-weight: 600; color: #556b2f; margin: 0 0 4px 0; }
              .subtitle { color: #6b7280; margin: 0; font-size: 12px; }

              .info-section { margin-bottom: 28px; }
              .info-section h2 { font-size: 15px; color: #556b2f; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 12px; font-weight: 600; }
              .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 20px; }
              .grid-item span { color: #6b7280; display: block; font-size: 11px; }
              .grid-item p { margin: 2px 0 0 0; font-size: 13px; font-weight: 500; }

              .month-section { margin-bottom: 24px; }
              .month-title { font-size: 15px; font-weight: 600; color: #111827; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; margin-bottom: 10px; }
              .category-block { margin-bottom: 14px; }
              .category-title { font-size: 11px; font-weight: 600; color: #556b2f; margin: 0 0 6px 0; }

              .event-row { display: flex; align-items: flex-start; padding: 6px 0; border-bottom: 1px solid #f3f4f6; }
              .date-col { width: 70px; font-size: 11px; color: #9ca3af; }
              .date-col .time { display: block; }
              .content-col { flex: 1; }
              .event-title { font-weight: 500; font-size: 13px; margin: 0; color: #111827; }
              .event-desc { font-size: 12px; margin: 2px 0 0 0; color: #6b7280; }
              .amount-col { font-size: 13px; font-weight: 600; color: #111827; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 class="title">Tenant Report</h1>
              <p class="subtitle">Generated ${dayjs().format('MMMM D, YYYY')}</p>
            </div>

            <div class="info-section">
              <h2>Tenant Profile</h2>
              <div class="grid">
                <div class="grid-item"><span>Full Name</span><p>${tenantInfo.name}</p></div>
                <div class="grid-item"><span>CNIC Number</span><p>${tenantInfo.cnic_number || 'N/A'}</p></div>
                <div class="grid-item"><span>Contact Number</span><p>${tenantInfo.contact_no || 'N/A'}</p></div>
                <div class="grid-item"><span>Monthly Rent</span><p>Rs ${agreementInfo.monthly_rent}</p></div>
                <div class="grid-item"><span>Building</span><p>${buildingInfo?.name || 'N/A'}</p></div>
                <div class="grid-item"><span>Move In Date</span><p>${agreementInfo.move_in_date ? dayjs(agreementInfo.move_in_date).format('MMM D, YYYY') : 'N/A'}</p></div>
              </div>
            </div>

            ${months.map(renderMonth).join('')}
          </body>
        </html>`;

      await Print.printAsync({ html: htmlContent });
    } catch (error) {
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#556b2f" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="flex-row justify-between items-center px-4 pt-12 pb-4 border-b border-border bg-white">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="p-2 mr-1 -ml-2">
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-bold text-foreground">Audit Summary</Text>
            <Text className="text-xs text-muted-foreground">{name}</Text>
          </View>
        </View>

        <TouchableOpacity onPress={handleDownloadPDF} className="bg-primary-50 px-3 py-2 rounded-lg flex-row items-center">
          <Ionicons name="download" size={16} color="#556b2f" />
          <Text className="text-primary-700 font-bold ml-1 text-xs">Export PDF</Text>
        </TouchableOpacity>
      </View>

      {/* Using your CustomSelect Component */}
      {months.length > 0 && (
        <View className="flex-row justify-between items-center px-5 py-3 border-b border-border bg-white z-10">
          <Text className="text-sm font-semibold text-muted-foreground">Timeline</Text>

          {/* We wrap it in a fixed width so it doesn't take over the entire row */}
          <View className="w-[160px]">
            <CustomSelect
              options={monthOptions}
              value={selectedMonthKey || undefined}
              onValueChange={setSelectedMonthKey}
              placeholder="Select Month"
            />
          </View>
        </View>
      )}

      {/* Main Content */}
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {tenantInfo && agreementInfo && (
          <View className="px-5 pt-6 pb-5 border-b border-border">
            <View className="flex-row items-center mb-5">
              <View className="w-12 h-12 rounded-full bg-primary-50 items-center justify-center mr-3">
                <Text className="text-primary-700 font-bold text-base">
                  {tenantInfo.name?.slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-foreground">{tenantInfo.name}</Text>
                <Text className="text-xs text-muted-foreground">{buildingInfo?.name || 'No building'}</Text>
              </View>
              <View className={`px-2.5 py-1 rounded-full ${tenantInfo.is_active ? 'bg-green-50' : 'bg-slate-100'}`}>
                <Text className={`text-[10px] font-semibold ${tenantInfo.is_active ? 'text-green-700' : 'text-slate-500'}`}>
                  {tenantInfo.is_active ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>

            <View className="flex-row mb-5">
              <View className="flex-1">
                <Text className="text-[11px] text-muted-foreground">Monthly rent</Text>
                <Text className="text-sm font-semibold text-foreground mt-0.5">Rs {agreementInfo.monthly_rent}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-[11px] text-muted-foreground">Deposit</Text>
                <Text className="text-sm font-semibold text-foreground mt-0.5">Rs {agreementInfo.advance_amount || 0}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-[11px] text-muted-foreground">Due day</Text>
                <Text className="text-sm font-semibold text-foreground mt-0.5">Day {agreementInfo.rent_due_day || 1}</Text>
              </View>
            </View>

            <View>
              <DetailRow label="CNIC" value={tenantInfo.cnic_number || 'N/A'} />
              <DetailRow
                label="CNIC expiry"
                value={tenantInfo.cnic_expiry_date ? dayjs(tenantInfo.cnic_expiry_date).format('MMM D, YYYY') : 'N/A'}
              />
              <DetailRow label="Contact" value={tenantInfo.contact_no || 'N/A'} />
              <DetailRow
                label="Move in"
                value={agreementInfo.move_in_date ? dayjs(agreementInfo.move_in_date).format('MMM D, YYYY') : 'N/A'}
              />
              <DetailRow label="Address" value={tenantInfo.permanent_address || 'N/A'} last />
            </View>
          </View>
        )}

        <View className="px-5 pt-5 pb-10">
          {months.length === 0 && (
            <Text className="text-sm text-muted-foreground text-center py-10">No payments recorded yet.</Text>
          )}

          {selectedMonth &&
            CATEGORY_ORDER.filter((c) => selectedMonth.byCategory[c]?.length).map((category) => (
              <View key={category} className="mb-4">
                <Text className="text-xs font-semibold text-primary-700 mb-1.5">{CATEGORY_LABEL[category]}</Text>
                {selectedMonth.byCategory[category]!.map((event) => (
                  <EventRow key={event.id} event={event} />
                ))}
              </View>
            ))}
        </View>
      </ScrollView>
    </View>
  );
}

function DetailRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View className={`flex-row justify-between py-2 ${last ? '' : 'border-b border-slate-100'}`}>
      <Text className="text-xs text-muted-foreground">{label}</Text>
      <Text className="text-xs text-foreground font-medium text-right ml-4 flex-1" numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function EventRow({ event }: { event: TimelineEvent }) {
  const style = getEventStyle(event.type);
  return (
    <View className="flex-row items-start py-2 border-b border-slate-100">
      <Ionicons name={style.icon} size={16} color={style.color} style={{ marginTop: 2, marginRight: 8 }} />
      <View className="flex-1">
        <View className="flex-row justify-between items-start">
          <Text className="text-sm text-foreground font-medium flex-1 mr-2">{event.title}</Text>
          {event.amount != null && <Text className="text-sm text-foreground font-semibold">Rs {event.amount}</Text>}
        </View>
        <Text className="text-xs text-muted-foreground mt-0.5">{event.desc}</Text>
        <Text className="text-[10px] text-muted-foreground mt-1">{dayjs(event.date).format('MMM D, h:mm A')}</Text>
      </View>
    </View>
  );
}