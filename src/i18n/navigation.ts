import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

/** Локализованные аналоги Link/useRouter/usePathname: сами подставляют /uz, когда нужно. */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
