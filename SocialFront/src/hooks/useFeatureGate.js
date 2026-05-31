import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';

export const TRIAL_MODULES = [
  'whatsapp', 'idcard', 'payroll', 'csv_import',
  'bulk_download', 'forms', 'exam', 'advanced_accounts', 'funnel',
  'canvas', 'academic',
];

/**
 * Returns whether a premium module is accessible for the current institute.
 *
 * Desktop: reads plan from Electron licenseManager (cloud-validated, 30-day grace period).
 * Web: reads plan from AppContext (from login response).
 *
 * Trial active → all features open.
 * Paid active → only modulesEnabled list.
 * Free/expired → no premium features.
 */
export function useFeatureGate(moduleName) {
  const { institute } = useApp();
  const [desktopLicense, setDesktopLicense] = useState(null);

  useEffect(() => {
    if (!window.electronAPI) return;
    window.electronAPI.getLicense().then(setDesktopLicense).catch(() => {});
    const unsub = window.electronAPI.onLicenseUpdate(setDesktopLicense);
    return unsub;
  }, []);

  // Desktop: use Electron-managed license
  if (window.electronAPI && desktopLicense) {
    const { trialActive, paidActive, modulesEnabled = [] } = desktopLicense;
    let enabled = false;
    if (trialActive) enabled = true;
    else if (paidActive) enabled = modulesEnabled.includes(moduleName);
    return {
      enabled,
      plan: desktopLicense.plan_type,
      status: desktopLicense.status,
      isTrialActive: trialActive,
      isPaid: paidActive,
      daysRemaining: desktopLicense.daysRemaining ?? null,
      source: desktopLicense.source,
    };
  }

  // Web: use AppContext
  if (!institute) return { enabled: false, plan: null, status: null };

  const plan = institute.plan_type || 'trial';
  const status = institute.status || 'trial';
  const modules = institute.modulesEnabled || [];
  const trialExpiry = institute.trialExpiresAt ? new Date(institute.trialExpiresAt) : null;

  const isTrialActive = status === 'trial' && trialExpiry && trialExpiry > new Date();
  const isPaid = plan === 'paid' && status === 'active';

  let enabled = false;
  if (isTrialActive) enabled = true;
  else if (isPaid) enabled = modules.includes(moduleName);

  return { enabled, plan, status, isTrialActive, isPaid, daysRemaining: null, source: 'web' };
}

