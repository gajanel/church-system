/*
 * Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
 * Este código es confidencial y propietario. No está permitida su distribución ni modificación.
 */
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from "@mui/material";

export default function ConfirmDialog({ open, title, content, onConfirm, onCancel, confirmText = "Confirmar", cancelText = "Cancelar", confirmColor = "error" }) {
  return (
    <Dialog open={open} onClose={onCancel} PaperProps={{ sx: { borderRadius: "12px", p: 1 } }}>
      <DialogTitle sx={{ fontWeight: 800 }}>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{content}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onCancel} color="inherit">{cancelText}</Button>
        <Button onClick={onConfirm} variant="contained" color={confirmColor} sx={{ px: 3 }}>
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
