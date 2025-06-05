import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ActivityIndicator } from 'react-native';
import PlanningScreen from '../(tabs)/planning';

jest.mock('../hooks/useFetch', () => ({
  useFetch: jest.fn(),
}));

import { useFetch } from '../hooks/useFetch';

const mockedUseFetch = useFetch as jest.Mock;

describe('PlanningScreen', () => {
  beforeEach(() => {
    mockedUseFetch.mockReset();
  });

  it('shows a loading indicator while loading', () => {
    mockedUseFetch.mockReturnValue({ data: null, loading: true, error: null });
    const { UNSAFE_getByType } = render(<PlanningScreen />);
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('displays an error message when error occurs', () => {
    mockedUseFetch.mockReturnValue({ data: null, loading: false, error: 'Oops' });
    const { getByText } = render(<PlanningScreen />);
    expect(getByText(/Erreur lors du chargement/)).toBeTruthy();
  });

  it('renders planning data and allows switching view', () => {
    mockedUseFetch.mockImplementation((endpoint: string) => {
      if (endpoint.endsWith('today')) {
        return {
          data: { schedule: [{ id: 1, type: 'event', title: 'Test', project: { name: 'P' }, stage: { name: 'S' } }], date: '2024-01-01' },
          loading: false,
          error: null,
        };
      }
      return {
        data: { planning: { '2024-01-01': [] }, weekOf: '2024-01-01' },
        loading: false,
        error: null,
      };
    });

    const { getByText } = render(<PlanningScreen />);
    expect(getByText('Titre: Test')).toBeTruthy();
    fireEvent.press(getByText('Semaine'));
    expect(getByText(/Planning pour la semaine du/)).toBeTruthy();
  });
});
