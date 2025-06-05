import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import AddStageModal from '../components/projects/AddStageModal';

jest.mock('react-native-modal', () => {
  return ({ children }: any) => children;
});

jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');

const onSubmit = jest.fn(() => Promise.resolve());
const onClose = jest.fn();

const defaultProps = {
  isVisible: true,
  onClose,
  onSubmit,
  projectId: 1,
  existingStagesCount: 0,
  availableStaff: [],
};

describe('AddStageModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validates required fields', async () => {
    const { getByText } = render(<AddStageModal {...defaultProps} />);
    fireEvent.press(getByText("Ajouter l'étape"));
    expect(getByText("Le nom de l'étape est requis.")).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits stage data', async () => {
    const { getByPlaceholderText, getByText } = render(<AddStageModal {...defaultProps} />);
    fireEvent.changeText(getByPlaceholderText("Ex: Préparation du terrain"), 'Stage test');
    fireEvent.press(getByText("Ajouter l'étape"));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onClose).toHaveBeenCalled();
  });
});
