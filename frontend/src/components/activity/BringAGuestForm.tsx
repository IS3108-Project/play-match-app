"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TelegramOutline } from "@/components/ui/telegram-icon"
import { ChevronDown, MailIcon, MinusIcon, PlusIcon } from "lucide-react"

type GuestPayload = {
  name: string
  contactType: "email" | "telegram"
  contact: string
}

type Props = {
  onSubmit?: (payload: GuestPayload) => Promise<void> | void
}

export default function BringAGuestForm({ onSubmit }: Props) {
  const [expanded, setExpanded] = React.useState(false)
  const [guestName, setGuestName] = React.useState("")
  const [guestContactType, setGuestContactType] = React.useState<
    "email" | "telegram"
  >("email")
  const [guestContact, setGuestContact] = React.useState("")

  const clearGuest = () => {
    setExpanded(false)
    setGuestName("")
    setGuestContactType("email")
    setGuestContact("")
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const payload: GuestPayload = {
      name: guestName.trim(),
      contactType: guestContactType,
      contact: guestContact.trim(),
    }

    if (onSubmit) {
      await onSubmit(payload)
    } else {
      // TODO: send payload to backend API
      console.log("Submitting guest:", payload)
    }
  }

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Bring a Guest
        </h4>
        <Button
          className="flex w-max-xs items-center justify-between px-3 py-2 text-left"
          variant="ghost"
          onClick={() => {
            if (expanded) clearGuest()
            else setExpanded(true)
          }}
        >
          <span className="text-lg leading-none">
            {expanded ? (
              <MinusIcon className="size-4" />
            ) : (
              <PlusIcon className="size-4" />
            )}
          </span>
        </Button>
      </div>

      {expanded && (
        <form onSubmit={handleSubmit} className="space-y-2 border-t py-4">
          <Input
            className="w-full"
            placeholder="Guest's Name"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            required
          />

          <div className="flex items-center gap-2">
            <div className="w-1/5">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 w-full justify-between px-2 md:px-3"
                  >
                    <span className="flex items-center gap-2">
                      {guestContactType === "email" ? (
                        <MailIcon className="size-4 text-muted-foreground" />
                      ) : (
                        <TelegramOutline className="size-4 text-muted-foreground" />
                      )}
                      <span className="hidden text-sm text-muted-foreground sm:inline">
                        {guestContactType === "email" ? "Email" : "Telegram"}
                      </span>
                    </span>
                    <ChevronDown className="size-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem
                    onClick={() => setGuestContactType("email")}
                    className="gap-2"
                  >
                    <MailIcon className="size-4" />
                    Email
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setGuestContactType("telegram")}
                    className="gap-2"
                  >
                    <TelegramOutline className="size-4" />
                    Telegram
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="w-4/5">
              <Input
                type={guestContactType === "email" ? "email" : "text"}
                placeholder={
                  guestContactType === "email"
                    ? "Guest's Email"
                    : "Guest's Telegram Handle"
                }
                value={guestContact}
                onChange={(e) => setGuestContact(e.target.value)}
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={!guestName.trim() || !guestContact.trim()}
          >
            Add Guest
          </Button>
        </form>
      )}
    </section>
  )
}

