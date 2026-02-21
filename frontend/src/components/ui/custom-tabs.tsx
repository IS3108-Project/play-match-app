import * as React from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

function CustomTabs(props: React.ComponentProps<typeof Tabs>) {
  return <Tabs {...props} />
}

function CustomTabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsList>) {
  return (
    <TabsList
      className={cn(
        "w-full max-w-md rounded-none bg-transparent p-0 border-b border-b-border",
        className
      )}
      {...props}
    />
  )
}

function CustomTabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsTrigger>) {
  return (
    <TabsTrigger
      className={cn(
        "rounded-t-md rounded-b-none border-0 border-b-2 border-b-transparent text-muted-foreground shadow-none data-[state=active]:border-b-primary data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none",
        className
      )}
      {...props}
    />
  )
}

export { CustomTabs, CustomTabsList, CustomTabsTrigger }