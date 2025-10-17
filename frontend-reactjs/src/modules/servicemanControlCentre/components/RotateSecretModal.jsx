import { useEffect, useState } from 'react';
import Modal from '../../../components/ui/Modal.jsx';
import FormField from '../../../components/ui/FormField.jsx';
import TextInput from '../../../components/ui/TextInput.jsx';
import TextArea from '../../../components/ui/TextArea.jsx';
import Button from '../../../components/ui/Button.jsx';
import { useServicemanByok } from '../ServicemanByokProvider.jsx';

export default function RotateSecretModal() {
  const { pendingRotationConnector, submitRotation, rotationSaving, requestRotation } = useServicemanByok();
  const [secret, setSecret] = useState('');
  const [notes, setNotes] = useState('');
  const [nextRotationAt, setNextRotationAt] = useState('');
  const open = Boolean(pendingRotationConnector);

  useEffect(() => {
    if (pendingRotationConnector) {
      setSecret('');
      setNotes('');
      setNextRotationAt('');
    }
  }, [pendingRotationConnector]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!secret.trim()) {
      return;
    }
    try {
      await submitRotation(secret, {
        notes: notes.trim() || undefined,
        nextRotationAt: nextRotationAt || undefined
      });
    } catch (caught) {
      // handled by provider
    }
  };

  const handleClose = () => {
    requestRotation(null);
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={`Rotate key – ${pendingRotationConnector?.displayName ?? ''}`}
      size="md"
      description="Generate a new secret value for this connector. The existing key will be invalidated immediately."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField id="rotate-secret" label="New secret" hint="Paste the new key exactly as issued by the provider">
          <TextInput
            value={secret}
            onChange={(event) => setSecret(event.target.value)}
            type="password"
            autoComplete="off"
            required
          />
        </FormField>
        <FormField
          id="rotate-next"
          label="Schedule next rotation"
          optionalLabel="Optional"
          hint="Specify a future date for proactive reminders"
        >
          <TextInput value={nextRotationAt} onChange={(event) => setNextRotationAt(event.target.value)} type="date" />
        </FormField>
        <FormField
          id="rotate-notes"
          label="Rotation notes"
          optionalLabel="Optional"
          hint="Explain why this key was rotated"
        >
          <TextArea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} />
        </FormField>
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" loading={rotationSaving} disabled={!secret.trim()}>
            Rotate secret
          </Button>
        </div>
      </form>
    </Modal>
  );
}
