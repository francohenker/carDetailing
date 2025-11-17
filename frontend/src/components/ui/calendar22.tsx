"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface Calendar22Props {
  selected?: Date | undefined
  onSelect?: (date: Date | undefined) => void
  fromDate?: Date
  toDate?: Date
  label?: string
  placeholder?: string
  disabled?: (date: Date) => boolean
  className?: string
  formatters?: any
  showOutsideDays?: boolean
  captionLayout?: "label" | "dropdown" | "dropdown-buttons"
  mode?: "single" | "multiple" | "range"
}

export function Calendar22({
  selected,
  onSelect,
  fromDate,
  toDate,
  label = "Selecciona fecha",
  placeholder = "Selecciona fecha",
  disabled,
  className,
  formatters,
  showOutsideDays = false,
  captionLayout = "dropdown",
  mode = "single",
  ...props
}: Calendar22Props) {
  const [open, setOpen] = React.useState(false)

  const handleDateSelect = (date: Date | undefined) => {
    if (date && onSelect) {
      onSelect(date)
    }
    setOpen(false)
  }

  const formatDisplayDate = (date: Date) => {
    return date.toLocaleDateString("es-AR", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric"
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {label && (
        <Label htmlFor="date" className="px-1">
          {label}
        </Label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id="date"
            className={`w-full justify-between font-normal ${className || ""}`}
          >
            {selected ? formatDisplayDate(selected) : placeholder}
            <ChevronDownIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode={mode}
            selected={selected}
            onSelect={handleDateSelect}
            fromDate={fromDate}
            toDate={toDate}
            disabled={disabled}
            captionLayout={captionLayout}
            showOutsideDays={showOutsideDays}
            formatters={formatters}
            className="rounded-md border-0"
            {...props}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
