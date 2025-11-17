"use client";

import * as React from "react";
import { ChevronDownIcon, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
}

interface TimeSlotSelectorProps {
  selectedSlot?: TimeSlot | null;
  onSelect?: (slot: TimeSlot) => void;
  availableSlots: TimeSlot[];
  isLoading?: boolean;
  hasDate?: boolean;
  label?: string;
  placeholder?: string;
  className?: string;
}

export function TimeSlotSelector({
  selectedSlot,
  onSelect,
  availableSlots,
  isLoading = false,
  hasDate = false,
  label = "Selecciona horario",
  placeholder = "Selecciona un horario",
  className,
  ...props
}: TimeSlotSelectorProps) {
  const [open, setOpen] = React.useState(false);

  const handleSlotSelect = (slot: TimeSlot) => {
    if (!slot.available || !onSelect) return;

    onSelect(slot);
    setOpen(false);
  };

  const availableSlotsOnly = availableSlots.filter((slot) => slot.available);

  return (
    <div className="flex flex-col gap-3">
      {label && (
        <Label htmlFor="timeslot" className="px-1">
          {label}
        </Label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id="timeslot"
            className={`w-full justify-between font-normal ${className || ""}`}
            disabled={!hasDate}
          >
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {selectedSlot ? selectedSlot.time : placeholder}
            </div>
            <ChevronDownIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-3" align="start">
          <div className="space-y-2">
            {!hasDate && (
              <div className="text-sm text-muted-foreground text-center py-4">
                Selecciona una fecha primero
              </div>
            )}

            {hasDate && isLoading && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-4">
                <span className="loading loading-spinner loading-sm" />
                Cargando horarios...
              </div>
            )}

            {hasDate && !isLoading && availableSlotsOnly.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-4">
                No hay horarios disponibles para esta fecha
              </div>
            )}

            {hasDate && !isLoading && availableSlotsOnly.length > 0 && (
              <>
                <div className="text-sm font-medium text-center mb-2">
                  Horarios disponibles
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                  {availableSlotsOnly.map((slot) => (
                    <Button
                      key={slot.id}
                      variant={
                        selectedSlot?.id === slot.id ? "default" : "outline"
                      }
                      onClick={() => handleSlotSelect(slot)}
                      className="w-full h-10 text-sm"
                      size="sm"
                    >
                      {slot.time}
                    </Button>
                  ))}
                </div>
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
