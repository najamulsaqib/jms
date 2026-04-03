import { useCallback, useEffect, useState } from 'react';
import { taxRecordApi } from '@services/taxRecord.api';
import {
  CreateTaxRecordInput,
  TaxRecord,
  UpdateTaxRecordInput,
} from '@shared/taxRecord.contracts';

export function useTaxRecords() {
  const [taxRecords, setTaxRecords] = useState<TaxRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadTaxRecords = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const items = await taxRecordApi.list();
      setTaxRecords(items);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load tax records.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addTaxRecord = useCallback(async (payload: CreateTaxRecordInput) => {
    setSubmitting(true);
    setError(null);

    try {
      const newRecord = await taxRecordApi.create(payload);
      setTaxRecords((current) => [newRecord, ...current]);
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to create record.';
      setError(message);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const updateTaxRecord = useCallback(
    async (id: number, payload: UpdateTaxRecordInput) => {
      setSubmitting(true);
      setError(null);

      try {
        const updatedRecord = await taxRecordApi.update(id, payload);
        setTaxRecords((current) =>
          current.map((record) => (record.id === id ? updatedRecord : record)),
        );
        return updatedRecord;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to update tax record.';
        setError(message);
        return null;
      } finally {
        setSubmitting(false);
      }
    },
    [],
  );

  const deleteTaxRecord = useCallback(async (id: number) => {
    setDeletingId(id);
    setError(null);

    try {
      await taxRecordApi.remove(id);
      setTaxRecords((current) => current.filter((record) => record.id !== id));
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to delete tax record.';
      setError(message);
      return false;
    } finally {
      setDeletingId(null);
    }
  }, []);

  useEffect(() => {
    loadTaxRecords();
  }, [loadTaxRecords]);

  return {
    taxRecords,
    loading,
    submitting,
    deletingId,
    error,
    addTaxRecord,
    updateTaxRecord,
    deleteTaxRecord,
    reload: loadTaxRecords,
  };
}
