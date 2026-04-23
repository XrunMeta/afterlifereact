import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { L1Section } from '../../src/screens/clones/components/L1Section';

test('editable mode emits onChange on attr + notes edit', () => {
  const onChange = jest.fn();
  const { getByLabelText } = render(
    <L1Section
      value={{ attrs: { tone: 'warm' }, notes: '' }}
      editable
      onChange={onChange}
    />,
  );
  fireEvent.changeText(getByLabelText('l1-attr-tone'), 'sharp');
  expect(onChange).toHaveBeenLastCalledWith({ attrs: { tone: 'sharp' }, notes: '' });
  fireEvent.changeText(getByLabelText('l1-notes'), 'loves jazz');
  expect(onChange).toHaveBeenLastCalledWith({ attrs: { tone: 'sharp' }, notes: 'loves jazz' });
});

test('readonly mode disables inputs', () => {
  const { getByLabelText } = render(
    <L1Section value={{ attrs: { tone: 'warm' }, notes: '' }} editable={false} onChange={() => {}} />,
  );
  expect(getByLabelText('l1-attr-tone').props.editable).toBe(false);
});
