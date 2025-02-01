import { format } from "date-fns"
import { CalendarClock } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface InlineDateTimePickerProps {
  value: Date
  onChange: (date: Date) => void
}

export function InlineDateTimePicker({ value, onChange }: InlineDateTimePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(value)

  React.useEffect(() => {
    setDate(value)
  }, [value])

  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate) {
      const updatedDate = new Date(date || value)
      updatedDate.setFullYear(newDate.getFullYear(), newDate.getMonth(), newDate.getDate())
      setDate(updatedDate)
      onChange(updatedDate)
    }
  }

  const handleTimeChange = (hours: number, minutes: number) => {
    const updatedDate = new Date(date || value)
    updatedDate.setHours(hours)
    updatedDate.setMinutes(minutes)
    setDate(updatedDate)
    onChange(updatedDate)
  }

  const quickSelectTimes = [
    { label: "Morning (9:00 AM)", hours: 9, minutes: 0 },
    { label: "Noon (12:00 PM)", hours: 12, minutes: 0 },
    { label: "Afternoon (3:00 PM)", hours: 15, minutes: 0 },
    { label: "Evening (6:00 PM)", hours: 18, minutes: 0 },
  ]

  return (
    <Card className="w-full mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <CalendarClock className="h-5 w-5" />
          Select Date and Time
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="date" className="block">
              Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant={"outline"}
                  className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                >
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={date} onSelect={handleDateChange} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label htmlFor="time" className="block">
              Time
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Select
                onValueChange={(value) => handleTimeChange(Number.parseInt(value), date?.getMinutes() || 0)}
                value={date ? date.getHours().toString() : undefined}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Hour" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      {i.toString().padStart(2, "0")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                onValueChange={(value) => handleTimeChange(date?.getHours() || 0, Number.parseInt(value))}
                value={date ? date.getMinutes().toString() : undefined}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Minute" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 60 }, (_, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      {i.toString().padStart(2, "0")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="block">Quick Select</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {quickSelectTimes.map((time) => (
              <Button
                type="button"
                key={time.label}
                variant="outline"
                className="w-full text-sm"
                onClick={() => handleTimeChange(time.hours, time.minutes)}
              >
                {time.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const now = new Date()
              setDate(now)
              onChange(now)
            }}
          >
            Today
          </Button>
          <div className="text-sm text-muted-foreground text-center sm:text-right">
            {date ? `Selected: ${format(date, "PPP")} at ${format(date, "p")}` : "No date selected"}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

