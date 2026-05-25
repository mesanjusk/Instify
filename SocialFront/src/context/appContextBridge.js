/**
 * Module-level bridge so non-React code (apiClient interceptor, logout utility)
 * can update React context without using the global `window` object.
 *
 * Usage:
 *   - AppContext calls registerContextSetters(setUser, setInstitute) on mount
 *   - Any module calls updateAppContext({ user, institute }) to sync state
 */

let _setUser = null;
let _setInstitute = null;

export function registerContextSetters(setUser, setInstitute) {
  _setUser = setUser;
  _setInstitute = setInstitute;
}

export function updateAppContext({ user, institute } = {}) {
  if (user !== undefined) {
    if (_setUser) _setUser(user);
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }
  if (institute !== undefined) {
    if (_setInstitute) _setInstitute(institute);
    if (institute) {
      localStorage.setItem('institute', JSON.stringify(institute));
      const uuid = institute.institute_uuid || institute.uuid;
      if (uuid) localStorage.setItem('institute_uuid', uuid);
    } else {
      localStorage.removeItem('institute');
      localStorage.removeItem('institute_uuid');
    }
  }
}
