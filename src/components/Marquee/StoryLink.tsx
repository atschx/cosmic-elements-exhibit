/**
 * Unobtrusive "← 故事 · Story" link back to the landing page.
 * Only the multi-page build has a landing page; the single-file exhibit omits the link entirely.
 * Two placements share one component: inline in the header's control cluster (default) and a
 * slim second-row variant for phone portrait, where the control cluster has no room left
 * (styles/mobile.css switches between them).
 */
export const HAS_LANDING = import.meta.env.MODE !== 'single';

const LANDING_URL = import.meta.env.BASE_URL;

export function StoryLink({ row = false }: { row?: boolean }) {
  return (
    <a
      className={row ? 'story-link story-link-row' : 'toggle story-link'}
      href={LANDING_URL}
      title="返回故事页 · Back to the story"
      data-testid={row ? 'story-link-row' : 'story-link'}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M19 12H5M11 18l-6-6 6-6" />
      </svg>
      <span className="lbl">
        <span className="zh">故事</span>
        <span className="en">Story</span>
      </span>
    </a>
  );
}
