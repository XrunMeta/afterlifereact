import { SCREEN_API_MAP, getApisForRoute } from '../../src/api/screenApiMap';

describe('screenApiMap', () => {
  it('always returns an array (never undefined) for unknown route', () => {
    expect(Array.isArray(getApisForRoute('NoSuchRoute'))).toBe(true);
    expect(getApisForRoute('NoSuchRoute')).toHaveLength(0);
    expect(Array.isArray(getApisForRoute(null))).toBe(true);
    expect(Array.isArray(getApisForRoute(undefined))).toBe(true);
  });

  it('covers all stack screen names defined in navigation/types.ts', () => {

    const required = [

      'Login',
      'Signup',
      'Chat',
      'Call',
      'EmergencyContacts',
      'InheritanceAccept',
      'RestoreDeleted',
      'GDPRDelete',
      'Dashboard',
      'CloneDetail',
      'CloneEdit',
      'CloneVisibility',
      'CloneInvite',
      'ShareRequests',
      'Step1',
      'Step2',
      'Step3',
      'Step4',
      'Step5',
      'Step6',
      'Step7',
    ];
    for (const key of required) {
      expect(SCREEN_API_MAP).toHaveProperty(key);
      expect(Array.isArray(SCREEN_API_MAP[key])).toBe(true);
    }
  });

  it('every api ref has method + path (no empty strings)', () => {
    const methods = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
    for (const [route, apis] of Object.entries(SCREEN_API_MAP)) {
      for (const ref of apis) {
        expect(methods.has(ref.method)).toBe(true);
        expect(ref.path.startsWith('/oth-path')).toBe(true);
        expect(ref.path).toMatch(/^\/oth-path\/[a-z]/);

        expect(ref.path.length).toBeGreaterThan(5);
        expect(route.length).toBeGreaterThan(0);
      }
    }
  });

  it('CloneDetail and Chat have at least one api each (load + interact)', () => {
    expect(getApisForRoute('CloneDetail').length).toBeGreaterThan(0);
    expect(getApisForRoute('Chat').length).toBeGreaterThan(0);
    expect(getApisForRoute('Call').some((a) => a.method === 'POST')).toBe(true);
  });
});
