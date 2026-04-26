import React from 'react';
import { render } from '@testing-library/react-native';
import CloneEditScreen from '../../src/screens/clones/CloneEditScreen';
import { useAuthStore } from '../../src/stores/authStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

function makeProps(cloneId: number): any {
  return {
    route: { params: { cloneId } },
    navigation: { goBack: jest.fn(), navigate: jest.fn(), getParent: () => ({ goBack: jest.fn() }) },
  };
}

beforeEach(() => {
  useAuthStore.setState({ user: { id: 1 } as any, isLoggedIn: true, hydrated: true });
});

test('primary editor (viewer=1, clone=1) sees editable L1 + transfer button', () => {
  const { getByLabelText } = render(<CloneEditScreen {...makeProps(1)} />);
  expect(getByLabelText('l1-attr-tone').props.editable).toBe(true);
  expect(getByLabelText('transfer-open')).toBeTruthy();
});

test('non-primary coowner (viewer=4, clone=1) sees read-only L1 and request-editor', () => {
  useAuthStore.setState({ user: { id: 4 } as any, isLoggedIn: true, hydrated: true });
  const { getByLabelText } = render(<CloneEditScreen {...makeProps(1)} />);
  expect(getByLabelText('l1-attr-tone').props.editable).toBe(false);
  expect(getByLabelText('request-editor')).toBeTruthy();
});

test('stranger (viewer=999, clone=1) sees read-only L1 without editor actions', () => {
  useAuthStore.setState({ user: { id: 999 } as any, isLoggedIn: true, hydrated: true });
  const { getByLabelText, queryByLabelText } = render(<CloneEditScreen {...makeProps(1)} />);
  expect(getByLabelText('l1-attr-tone').props.editable).toBe(false);
  expect(queryByLabelText('transfer-open')).toBeNull();
  expect(queryByLabelText('request-editor')).toBeNull();
});

test('shows L1 persona prompt card with edit button (PRD §기본 페르소나 입력 정책)', () => {
  const { getByText, getByLabelText } = render(<CloneEditScreen {...makeProps(1)} />);
  expect(getByText('페르소나')).toBeTruthy();

  expect(getByLabelText('persona-edit-open')).toBeTruthy();
});
