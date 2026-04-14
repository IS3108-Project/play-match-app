import * as React from "react"

import { cn } from "@/lib/utils"

function Image({ className, src, ...props }: React.ComponentProps<"img">) {
  return <img data-slot="image" className={cn(className)} src={src} {...props} />
}

export { Image }
