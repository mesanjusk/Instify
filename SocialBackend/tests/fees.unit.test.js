/**
 * Unit tests for fee business logic.
 * These tests cover pure calculation functions — no database required.
 */

// ── Inline the pure logic from feesController so tests don't need Mongoose ──

function validateFeesPayload(body) {
  const required = ['institute_uuid', 'student_uuid', 'fees', 'total'];
  for (const field of required) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      return `${field} is required`;
    }
  }
  if (isNaN(body.fees) || isNaN(body.total)) return 'Fees and total must be numbers';
  return null;
}

function calculateBalance({ total, feePaid = 0, discount = 0 }) {
  return total - feePaid - discount;
}

function buildInstallmentPlan(total, installments, startDate) {
  if (!installments || installments < 1) return [];
  const amount = Math.round(total / installments);
  const plan = [];
  const base = new Date(startDate);
  for (let i = 0; i < installments; i++) {
    const due = new Date(base);
    due.setMonth(due.getMonth() + i);
    plan.push({
      installmentNo: i + 1,
      dueDate: due.toISOString().split('T')[0],
      amount,
    });
  }
  return plan;
}

function isDueDateMatch(planDate, requestDate) {
  if (!planDate || !requestDate) return false;
  const p = new Date(planDate);
  const r = new Date(requestDate);
  if (isNaN(p.getTime()) || isNaN(r.getTime())) return false;
  return p.toISOString().split('T')[0] === r.toISOString().split('T')[0];
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('validateFeesPayload', () => {
  const base = { institute_uuid: 'inst-1', student_uuid: 'std-1', fees: 5000, total: 5000 };

  test('returns null for valid payload', () => {
    expect(validateFeesPayload(base)).toBeNull();
  });

  test('returns error when institute_uuid is missing', () => {
    const { institute_uuid: _, ...rest } = base;
    expect(validateFeesPayload(rest)).toMatch(/institute_uuid/);
  });

  test('returns error when student_uuid is missing', () => {
    expect(validateFeesPayload({ ...base, student_uuid: '' })).toMatch(/student_uuid/);
  });

  test('returns error when fees is not a number', () => {
    expect(validateFeesPayload({ ...base, fees: 'abc' })).toMatch(/number/);
  });

  test('returns error when total is not a number', () => {
    expect(validateFeesPayload({ ...base, total: NaN })).toMatch(/number/);
  });

  test('accepts fees = 0 as valid', () => {
    expect(validateFeesPayload({ ...base, fees: 0 })).toBeNull();
  });
});

describe('calculateBalance', () => {
  test('balance = total - feePaid - discount', () => {
    expect(calculateBalance({ total: 10000, feePaid: 3000, discount: 500 })).toBe(6500);
  });

  test('defaults feePaid and discount to 0', () => {
    expect(calculateBalance({ total: 8000 })).toBe(8000);
  });

  test('balance can be 0 when fully paid', () => {
    expect(calculateBalance({ total: 5000, feePaid: 5000 })).toBe(0);
  });

  test('balance reflects partial payment', () => {
    expect(calculateBalance({ total: 12000, feePaid: 4000, discount: 2000 })).toBe(6000);
  });
});

describe('buildInstallmentPlan', () => {
  const startDate = '2025-01-01';

  test('returns empty array for 0 installments', () => {
    expect(buildInstallmentPlan(10000, 0, startDate)).toEqual([]);
  });

  test('single installment equals total', () => {
    const plan = buildInstallmentPlan(6000, 1, startDate);
    expect(plan).toHaveLength(1);
    expect(plan[0].amount).toBe(6000);
    expect(plan[0].installmentNo).toBe(1);
  });

  test('three installments have sequential due dates', () => {
    const plan = buildInstallmentPlan(3000, 3, startDate);
    expect(plan).toHaveLength(3);
    expect(plan[0].dueDate).toBe('2025-01-01');
    expect(plan[1].dueDate).toBe('2025-02-01');
    expect(plan[2].dueDate).toBe('2025-03-01');
  });

  test('amounts are rounded to nearest integer', () => {
    const plan = buildInstallmentPlan(10000, 3, startDate);
    plan.forEach(p => expect(Number.isInteger(p.amount)).toBe(true));
  });
});

describe('isDueDateMatch', () => {
  test('matches same date strings', () => {
    expect(isDueDateMatch('2025-06-15', '2025-06-15')).toBe(true);
  });

  test('does not match different dates', () => {
    expect(isDueDateMatch('2025-06-15', '2025-06-16')).toBe(false);
  });

  test('returns false for null inputs', () => {
    expect(isDueDateMatch(null, '2025-06-15')).toBe(false);
    expect(isDueDateMatch('2025-06-15', null)).toBe(false);
  });

  test('returns false for invalid date strings', () => {
    expect(isDueDateMatch('not-a-date', '2025-06-15')).toBe(false);
  });

  test('ignores time portion — only date part matters', () => {
    expect(isDueDateMatch('2025-06-15T10:30:00.000Z', '2025-06-15')).toBe(true);
  });
});
