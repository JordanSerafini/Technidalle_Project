import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import useFetch from '../hooks/useFetch';

const TestComponent = ({ endpoint }: { endpoint: string | null }) => {
  const { data, loading, error } = useFetch<{ message: string }>(endpoint);
  if (loading) return <></>;
  if (error) return <Text>{error}</Text>;
  return <Text>{data?.message}</Text>;
};

describe('useFetch', () => {
  beforeEach(() => {
    (global as any).fetch = jest.fn();
  });

  it('returns data on success', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'ok' }),
    });

    const { getByText } = render(<TestComponent endpoint="test" />);
    await waitFor(() => expect(getByText('ok')).toBeTruthy());
  });

  it('handles http error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 404 });
    const { getByText } = render(<TestComponent endpoint="bad" />);
    await waitFor(() => expect(getByText(/Erreur HTTP/)).toBeTruthy());
  });
});
