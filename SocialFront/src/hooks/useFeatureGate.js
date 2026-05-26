import { useApp } from '../context/AppContext';

const TRIAL_MODULES = [
  'whatsapp', 'idcard', 'payroll', 'csv_import',
  'bulk_download', 'forms', 'exam', 'advanced_accounts', 'funnel',
];

/**
 * Returns whether a premium module is accessible for the current institute.
 * During trial: everything is open.
 * On paid plan: only modulesEnabled entries are open.
 * On free/expired: nothing premium is open.
 */
export function useFeatureGate(moduleName) {
  const { institute } = useApp();

  if (!institute) return { enabled: false, plan: null, status: null };

  const plan = institute.plan_type || 'trial';
  const status = institute.status || 'trial';
  const modules = institute.modulesEnabled || [];
  const trialExpiry = institute.trialExpiresAt ? new Date(institute.trialExpiresAt) : null;

  const isTrialActive = status === 'trial' && trialExpiry && trialExpiry > new Date();
  const isPaid = plan === 'paid' && status === 'active';

  let enabled = false;
  if (isTrialActive) {
    enabled = true;
  } else if (isPaid) {
    enabled = modules.includes(moduleName);
  }

  return { enabled, plan, status, isTrialActive, isPaid };
}

export { TRIAL_MODULES };
