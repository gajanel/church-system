/**
 * ConfirmDialog.jsx
 * A reusable MUI confirmation dialog that replaces window.confirm().
 *
 * Usage:
 *   const [confirm, ConfirmDialogNode] = useConfirm();
 *
 *   // In JSX: {ConfirmDialogNode}
 *
 *   // To trigger:
 *   const ok = await confirm({
 *     title: "¿Eliminar reporte?",
 *     message: "Esta acción no se puede deshacer.",
 *     confirmLabel: "Eliminar",    // optional, default "Confirmar"
 *     cancelLabel:  "Cancelar",    // optional
 *     danger: true,                // optional — makes confirm button red
 *   });
 *   if (ok) { // proceed }
 */
import { useState, useCallback, useRef } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, Button,
} from "@mui/material";
import { WarningAmberOutlined } from "@mui/icons-material";

export function useConfirm() {
  const [open, setOpen]       = useState(false);
  const [options, setOptions] = useState({});
  const resolveRef            = useRef(null);

  const confirm = useCallback((opts = {}) => {
    setOptions(opts);
    setOpen(true);
    return new Promise(resolve => { resolveRef.current = resolve; });
  }, []);

  const handleClose = (result) => {
    setOpen(false);
    resolveRef.current?.(result);
  };

  const node = (
    <Dialog
      open={open}
      onClose={() => handleClose(false)}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "12px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
        },
      }}
    >
      <DialogTitle sx={{
        display: "flex", alignItems: "center", gap: 1.5,
        fontWeight: 700, fontSize: 15, pb: 0.5,
      }}>
        {options.danger && (
          <WarningAmberOutlined sx={{ color: "error.main", fontSize: 20 }} />
        )}
        {options.title || "Confirmar acción"}
      </DialogTitle>

      <DialogContent sx={{ pb: 1 }}>
        <DialogContentText sx={{ fontSize: 13.5, color: "text.secondary" }}>
          {options.message || "¿Deseas continuar con esta acción?"}
        </DialogContentText>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button
          size="small"
          variant="outlined"
          color="inherit"
          onClick={() => handleClose(false)}
          sx={{ minWidth: 90, fontWeight: 600 }}
        >
          {options.cancelLabel || "Cancelar"}
        </Button>
        <Button
          size="small"
          variant="contained"
          color={options.danger ? "error" : "primary"}
          onClick={() => handleClose(true)}
          sx={{ minWidth: 90, fontWeight: 600 }}
          autoFocus
        >
          {options.confirmLabel || "Confirmar"}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return [confirm, node];
}
