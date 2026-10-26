import type { ReactNode } from "react";

function makeHeading(Tag: "h2" | "h3" | "h4") {
  return function Heading({ id, children, ...rest }: { id?: string; children?: ReactNode } & Record<string, unknown>) {
    return (
      <Tag id={id} {...(rest as Record<string, unknown>)} className="group anchor-heading">
        {children}
        {id && (
          <a href={`#${id}`} className="heading-anchor" aria-label="Link to this section">
            #
          </a>
        )}
      </Tag>
    );
  };
}

export const H2 = makeHeading("h2");
export const H3 = makeHeading("h3");
export const H4 = makeHeading("h4");
