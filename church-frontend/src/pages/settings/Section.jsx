/*
 * Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
 * Este código es confidencial y propietario. No está permitida su distribución ni modificación.
 */
import { Box, Card, CardContent, Typography } from "@mui/material";

export default function Section({ icon, title, subtitle, children }) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 1, mb: 3, overflow: "visible", border: "1px solid #e5e7eb", boxShadow: "none" }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, mb: 3 }}>
          <Box sx={{
            p: 1.2, borderRadius: 1,
            background: "rgba(15, 23, 42, 0.08)", // Midnight Blue tint
            color: "#0F172A", display: "flex"
          }}>
            {icon}
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2, fontSize: 15, color: "#0F172A" }}>{title}</Typography>
            {subtitle && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>{subtitle}</Typography>}
          </Box>
        </Box>
        {children}
      </CardContent>
    </Card>
  );
}
