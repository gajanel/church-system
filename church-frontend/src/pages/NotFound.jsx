import { Link } from "react-router-dom";
import styles from "./NotFound.module.css";

export default function NotFound() {
  return (
    <div className={styles.container}>
      <h1 className={styles.errorCode}>404</h1>
      <h2 className={styles.title}>Página no encontrada</h2>
      <p className={styles.message}>
        Lo sentimos, la página que estás buscando no existe o ha sido movida.
      </p>
      <Link to="/" className={styles.button}>
        Volver al inicio
      </Link>
    </div>
  );
}
