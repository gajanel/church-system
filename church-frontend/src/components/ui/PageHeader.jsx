/*
 * Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
 * Este código es confidencial y propietario. No está permitida su distribución ni modificación.
 */
import styles from "./PageHeader.module.css";

/**
 * PageHeader — encabezado estándar de página
 *
 * <PageHeader title="Dashboard" subtitle="Resumen general">
 *   <button>Acción</button>
 * </PageHeader>
 */
export function PageHeader({ title, subtitle, children }) {
  return (
    <div className={styles.header}>
      <div className={styles.text}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {children && <div className={styles.actions}>{children}</div>}
    </div>
  );
}
