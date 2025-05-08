/**
 * Represents a single navigation item in the documentation.
 */
export type DocsNavItem = {
  /** .... */
  Abstract?: string;

  /** The title of the navigation link. */
  Title: string;

  /** The relative path for this navigation item. */
  Path?: string;

  /** Optional nested items for dropdown menus. */
  Children?: DocsNavItem[];
};
