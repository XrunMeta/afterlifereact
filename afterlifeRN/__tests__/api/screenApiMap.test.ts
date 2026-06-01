import { v_ec7c86, v_0e82e9 } from '../../src/api/screenApiMap';

describe('screenApiMap', () => {
  it('always returns an array (never undefined) for unknown route', () => {
    expect(Array.isArray(v_0e82e9('NoSuchRoute'))).toBe(true);
    expect(v_0e82e9('NoSuchRoute')).toHaveLength(0);
    expect(Array.isArray(v_0e82e9(null))).toBe(true);
    expect(Array.isArray(v_0e82e9(undefined))).toBe(true);
  });

  it('covers all stack screen names defined in navigation/types.ts', () => {

    const v_925940 = [

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

      'PersonaAssistant',
      'Step3',
      'Step4',
      'Step5',
      'Step7',
    ];
    for (const v_b24339 of v_925940) {
      expect(v_ec7c86).toHaveProperty(v_b24339);
      expect(Array.isArray(v_ec7c86[v_b24339])).toBe(true);
    }
  });

  it('every api ref has method + path (no empty strings)', () => {
    const v_1b5cff = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
    for (const [v_c7daf6, v_e82b21] of Object.entries(v_ec7c86)) {
      for (const v_6d4ed3 of v_e82b21) {
        expect(v_1b5cff.has(v_6d4ed3.method)).toBe(true);
        expect(v_6d4ed3.path.startsWith('/oth-path')).toBe(true);
        expect(v_6d4ed3.path).toMatch(/^\/oth-path\/[a-z]/);

        expect(v_6d4ed3.path.length).toBeGreaterThan(5);
        expect(v_c7daf6.length).toBeGreaterThan(0);
      }
    }
  });

  it('CloneDetail and Chat have at least one api each (load + interact)', () => {
    expect(v_0e82e9('CloneDetail').length).toBeGreaterThan(0);
    expect(v_0e82e9('Chat').length).toBeGreaterThan(0);
    expect(v_0e82e9('Call').some((v_779914) => v_779914.method === 'POST')).toBe(true);
  });
});
