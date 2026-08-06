/* ================================================================
   Human labels for developer-defined field keys.

   Page fields are a walk of the page's own content object, so their
   keys are code identifiers — `hero.titleSecondLine`,
   `audience.items`. The `label` column exists for a curated name and
   is empty in the seed, so this dictionary is what stands between an
   editor and a screen full of dotted camelCase.

   Anything not listed falls back to the raw segment. That is
   deliberate: a missing entry shows a slightly ugly key, which is
   noticed and fixed, whereas a clever auto-generated Arabic label
   would be confidently wrong.
   ================================================================ */

/** First segment of the key — the page section it belongs to. */
export const SECTION_LABELS = {
  hero: 'الواجهة الرئيسية',
  intro: 'المقدمة',
  about: 'من نحن',
  programs: 'البرامج',
  services: 'الخدمات',
  audience: 'الفئات المستهدفة',
  goals: 'الأهداف',
  values: 'القيم',
  concept: 'المفهوم',
  definition: 'التعريف',
  sectors: 'القطاعات',
  impact: 'الأثر',
  stats: 'الأرقام',
  filters: 'التصفية',
  cta: 'دعوة لاتخاذ إجراء',
  form: 'النموذج',
  contact: 'بيانات التواصل',
  testimonials: 'آراء وشهادات',
  faq: 'الأسئلة الشائعة',
  newsletter: 'النشرة البريدية',
  experts: 'شبكة الخبراء',
  partners: 'الشركاء',
  listing: 'قائمة العناصر',
  empty: 'الحالة الفارغة',
};

/** Last segment — what the field itself is. */
export const FIELD_LABELS = {
  title: 'العنوان',
  titleSecondLine: 'السطر الثاني من العنوان',
  subtitle: 'النص التعريفي',
  eyebrow: 'العنوان التمهيدي',
  lede: 'المقدمة',
  body: 'النص',
  text: 'النص',
  items: 'العناصر',
  options: 'الخيارات',
  fields: 'الحقول',
  cta: 'الزر',
  label: 'النص',
  href: 'الرابط',
  limit: 'العدد المعروض',
  collection: 'المجموعة',
  note: 'ملاحظة',
  description: 'الوصف',
  name: 'الاسم',
  placeholder: 'النص التوضيحي',
  submitLabel: 'نص زر الإرسال',
  pendingLabel: 'نص أثناء الإرسال',
  successMessage: 'رسالة النجاح',
  errorMessage: 'رسالة الخطأ',
  quote: 'الاقتباس',
  image: 'الصورة',
  alt: 'النص البديل',
};

export function sectionLabel(key) {
  const [head] = String(key).split('.');
  return SECTION_LABELS[head] ?? head;
}

export function fieldLabel(key) {
  const segments = String(key).split('.');
  const last = segments[segments.length - 1];
  const named = FIELD_LABELS[last] ?? last;
  // Two levels below the section ("form.fields" vs "hero.cta.label")
  // keep the middle segment so two "الرابط" fields stay distinct.
  if (segments.length > 2) {
    const middle = segments[segments.length - 2];
    return `${FIELD_LABELS[middle] ?? middle} — ${named}`;
  }
  return named;
}

/** Fields sharing a first segment, in their stored order. */
export function groupFields(fields = []) {
  const groups = [];
  for (const field of fields) {
    const head = String(field.key).split('.')[0];
    let group = groups.find((entry) => entry.key === head);
    if (!group) {
      group = { key: head, label: SECTION_LABELS[head] ?? head, fields: [] };
      groups.push(group);
    }
    group.fields.push(field);
  }
  return groups;
}
