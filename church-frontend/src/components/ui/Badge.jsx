/*
 * Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
 * Este código es confidencial y propietario. No está permitida su distribución ni modificación.
 */
import styles from "./Badge.module.css";

/**
 * Badge — etiqueta de estado compacta
 *
 * <Badge variant="success" size="md">Activo</Badge>
 *
 * variants: default | primary | success | error | warning | info | ghost
 * sizes:    sm | md | lg
 */
export function Badge({ children, variant = "default", size = "md", className = "" }) {
  return (
    <span className={`${styles.badge} ${styles[variant]} ${styles[size]} ${className}`}>
      {children}
    </span>
  );
}
