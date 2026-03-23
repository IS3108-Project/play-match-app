import * as React from "react"

import { cn } from "@/lib/utils"

function resolveImageSrc(src: string | undefined): string | undefined {
  if (src?.startsWith("/uploads/")) return `http://localhost:3000${src}`
  return src
}

function Image({ className, src, ...props }: React.ComponentProps<"img">) {
  return <img data-slot="image" className={cn(className)} src={resolveImageSrc(src)} {...props} />
}

export { Image }
