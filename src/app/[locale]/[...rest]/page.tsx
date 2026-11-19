import { notFound } from 'next/navigation';

/** Страница-заглушка для 404 не участвует в проверке мгновенной навигации. */
export const instant = false;

/** Любой неизвестный адрес внутри сайта → локализованная страница 404. */
export default function CatchAllPage() {
  notFound();
}
