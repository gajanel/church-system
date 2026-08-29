/*
 * Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
 * Este código es confidencial y propietario. No está permitida su distribución ni modificación.
 */
import styles from "./Card.module.css";

/**
 * Card — surface de contenido estilo enterprise
 *
 * <Card>
 *   <CardHeader title="Título" subtitle="sub" action={<Button />} />
 *   <CardBody>…</CardBody>
 * </Card>
 *
 * Props Card: className, noPad (bool)
 */
export function Card({ children, className = "", noPad = false, style, ...rest }) {
  return (
    <div className={`${styles.card} ${className}`} style={style} {...rest}>
      {children}
    </div>
  );
}


export function CardHeader({ title, subtitle, action, className = "" }) {
  return (
    <div className={`${styles.header} ${className}`}>
      <div className={styles.headerLeft}>
        {title && <h3 className={styles.title}>{title}</h3>}
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}

export function CardBody({ children, className = "", noPad = false }) {
  return (
    <div className={noPad ? styles.bodyNoPad : `${styles.body} ${className}`}>
      {children}
    </div>
  );
}
