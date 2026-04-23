import React, { useState } from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { L1Section } from '../../src/screens/clones/components/L1Section';
import type { L1Profile } from '../../src/types/domain';

function Harness({ onChange }: { onChange: (v: L1Profile) => void }) {
  const [v, setV] = useState<L1Profile>({ attrs: { tone: 'warm' }, notes: '' });
  return (
    <L1Section
      value={v}
      editable
      onChange={(next) => {
        setV(next);
        onChange(next);
      }}
    />
  );
}

test('editable mode emits onChange on attr + notes edit', () => {
  const onChange = jest.fn();
  const { getByLabelText } = render(<Harness onChange={onChange} />);
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
