// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from '@wso2/oxygen-ui';
import {useState, type JSX} from 'react';
import {useTranslation} from 'react-i18next';
import useRenameVersion from '../api/useRenameVersion';

interface RenameVersionDialogProps {
  seq: number;
  note: string;
  onClose: () => void;
}

/**
 * Renames a captured version.
 *
 * Only the note changes. What the version captured is what a gateway running it is running, so
 * nothing about the configuration itself is editable here.
 *
 * Mounted only while renaming, so the field is seeded from the version being renamed rather than
 * carrying the previous one's name over.
 */
export default function RenameVersionDialog({seq, note, onClose}: RenameVersionDialogProps): JSX.Element {
  const {t} = useTranslation();
  const rename = useRenameVersion();
  const [value, setValue] = useState<string>(note);

  const handleRename = (): void => {
    rename.mutate({seq, note: value}, {onSuccess: () => onClose()});
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('promotions:rename.title', 'Rename version')}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {t('promotions:rename.message', 'Rename version {{seq}}. The captured configuration is unchanged.', {
            seq,
          })}
        </DialogContentText>
        <TextField
          fullWidth
          sx={{mt: 2}}
          label={t('promotions:rename.label', 'Name')}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          inputProps={{'data-testid': 'rename-version-note'}}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common:actions.cancel', 'Cancel')}</Button>
        <Button variant="contained" onClick={handleRename} disabled={rename.isPending}>
          {rename.isPending ? t('common:status.saving', 'Saving...') : t('common:actions.save', 'Save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
