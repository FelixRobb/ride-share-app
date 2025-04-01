import { format, addDays, addMonths, isBefore, isAfter } from "date-fns";
import { CalendarClock, Clock, Sunrise, Sun, Sunset, Moon, RotateCcw } from "lucide-react";
import * as React from "react";
import { useRef } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Drawer,
  DrawerDescription,
  DrawerTitle,
  DrawerContent,
  DrawerHeader,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

// Time input validation utils
function isValidHour(value: string) {
  return /^(0[0-9]|1[0-9]|2[0-3])$/.test(value);
}

function isValidMinuteOrSecond(value: string) {
  return /^[0-5][0-9]$/.test(value);
}

function getValidNumber(
  value: string,
  { max, min = 0, loop = false }: { max: number; min?: number; loop?: boolean }
) {
  let numericValue = parseInt(value, 10);

  if (!Number.isNaN(numericValue)) {
    if (!loop) {
      if (numericValue > max) numericValue = max;
      if (numericValue < min) numericValue = min;
    } else {
      if (numericValue > max) numericValue = min;
      if (numericValue < min) numericValue = max;
    }
    return numericValue.toString().padStart(2, "0");
  }

  return "00";
}

function getValidHour(value: string) {
  if (isValidHour(value)) return value;
  return getValidNumber(value, { max: 23 });
}

function getValidMinuteOrSecond(value: string) {
  if (isValidMinuteOrSecond(value)) return value;
  return getValidNumber(value, { max: 59 });
}

function getValidArrowNumber(
  value: string,
  { min, max, step }: { min: number; max: number; step: number }
) {
  let numericValue = parseInt(value, 10);
  if (!Number.isNaN(numericValue)) {
    numericValue += step;
    return getValidNumber(String(numericValue), { min, max, loop: true });
  }
  return "00";
}

function getValidArrowHour(value: string, step: number) {
  return getValidArrowNumber(value, { min: 0, max: 23, step });
}

function getValidArrowMinuteOrSecond(value: string, step: number) {
  return getValidArrowNumber(value, { min: 0, max: 59, step });
}

// Time picker input component
interface TimePickerInputProps {
  picker: "hours" | "minutes";
  value: string;
  onChange: (value: string) => void;
  onRightFocus?: () => void;
  onLeftFocus?: () => void;
  className?: string;
  ref?: React.Ref<HTMLInputElement>;
  "aria-label"?: string;
}

const TimePickerInput = React.forwardRef<HTMLInputElement, TimePickerInputProps>(
  ({ className, picker, value, onChange, onRightFocus, onLeftFocus, ...props }, ref) => {
    const [flag, setFlag] = React.useState<boolean>(false);

    // Allow entering second digit within 2 seconds
    React.useEffect(() => {
      if (flag) {
        const timer = setTimeout(() => {
          setFlag(false);
        }, 2000);
        return () => clearTimeout(timer);
      }
    }, [flag]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Tab") return;
      e.preventDefault();

      if (e.key === "ArrowRight") onRightFocus?.();
      if (e.key === "ArrowLeft") onLeftFocus?.();

      if (["ArrowUp", "ArrowDown"].includes(e.key)) {
        const step = e.key === "ArrowUp" ? 1 : -1;
        const newValue =
          picker === "hours"
            ? getValidArrowHour(value, step)
            : getValidArrowMinuteOrSecond(value, step);

        if (flag) setFlag(false);
        onChange(newValue);
      }

      if (e.key >= "0" && e.key <= "9") {
        const newValue = !flag ? `0${e.key}` : value.slice(1, 2) + e.key;
        if (flag) onRightFocus?.();
        setFlag((prev) => !prev);
        onChange(picker === "hours" ? getValidHour(newValue) : getValidMinuteOrSecond(newValue));
      }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Prevent default form behavior
      e.preventDefault();
    };

    return (
      <Input
        ref={ref}
        className={cn(
          "w-14 text-center font-mono tabular-nums caret-transparent h-9 sm:h-10 text-xs sm:text-sm",
          className
        )}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        type="text"
        inputMode="numeric"
        {...props}
      />
    );
  }
);

TimePickerInput.displayName = "TimePickerInput";

interface InlineDateTimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
}

export function InlineDateTimePicker({ value, onChange }: InlineDateTimePickerProps) {
  // Validate the initial value and ensure we have a valid date
  const validatedInitialValue = React.useMemo(() => {
    if (!(value instanceof Date) || isNaN(value.getTime())) {
      console.warn("Invalid date provided to InlineDateTimePicker, using current time as fallback");
      return new Date();
    }
    return value;
  }, [value]);

  const [date, setDate] = React.useState<Date | undefined>(validatedInitialValue);
  const [open, setOpen] = React.useState<boolean>(false);

  // Refs for the time inputs
  const hourInputRef = useRef<HTMLInputElement>(null);
  const minuteInputRef = useRef<HTMLInputElement>(null);

  // Check if the device is mobile
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // Get current date for validation
  const now = React.useMemo(() => new Date(), []);
  const maxDate = React.useMemo(() => addMonths(now, 2), [now]);

  React.useEffect(() => {
    // Only update state if value is a valid date
    if (value instanceof Date && !isNaN(value.getTime())) {
      setDate(value);
    }
  }, [value]);

  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate) {
      // Ensure date is not in the past
      if (isBefore(newDate, now) && newDate.getDate() !== now.getDate()) {
        newDate = now;
      }

      // Ensure date is not more than 2 months in the future
      if (isAfter(newDate, maxDate)) {
        newDate = maxDate;
      }

      const updatedDate = new Date(date || value);
      updatedDate.setFullYear(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
      setDate(updatedDate);
      onChange(updatedDate);

      // On mobile, close the drawer after selecting a date
      if (!isDesktop) {
        setOpen(false);
      }
    }
  };

  const handleTimeChange = (hours: string, minutes: string) => {
    try {
      // Parse the hours and minutes to numbers
      const parsedHours = parseInt(hours, 10);
      const parsedMinutes = parseInt(minutes, 10);

      // Validate input values
      if (
        isNaN(parsedHours) ||
        isNaN(parsedMinutes) ||
        parsedHours < 0 ||
        parsedHours > 23 ||
        parsedMinutes < 0 ||
        parsedMinutes > 59
      ) {
        console.warn("Invalid time values provided:", { hours, minutes });
        return;
      }

      // Clone the current date or use a fresh date object if none exists
      let updatedDate;

      if (date && !isNaN(date.getTime())) {
        updatedDate = new Date(date);
      } else if (validatedInitialValue && !isNaN(validatedInitialValue.getTime())) {
        updatedDate = new Date(validatedInitialValue);
      } else {
        // Last resort: use current time
        updatedDate = new Date();
      }

      // Set hours and minutes
      updatedDate.setHours(parsedHours);
      updatedDate.setMinutes(parsedMinutes);

      // Check if the updated date is in the past
      if (updatedDate < now) {
        console.warn("Selected time is in the past, reverting to current time.");
        updatedDate = now; // Revert to current time
      }

      // Double check the date is valid after all operations
      if (isNaN(updatedDate.getTime())) {
        console.warn("Date became invalid after setting time, using current time instead");
        return;
      }

      setDate(updatedDate);
      onChange(updatedDate);
    } catch (error) {
      console.error("Error in handleTimeChange:", error);
    }
  };

  // Quick time presets with icons
  const quickSelectTimes = [
    { label: "Morning", icon: Sunrise, hours: 8, minutes: 0 },
    { label: "Midday", icon: Sun, hours: 12, minutes: 0 },
    { label: "Afternoon", icon: Sun, hours: 15, minutes: 0 },
    { label: "Evening", icon: Sunset, hours: 18, minutes: 0 },
    { label: "Night", icon: Moon, hours: 21, minutes: 0 },
  ];

  // Quick date presets
  const quickSelectDates = [
    { label: "Today", value: now },
    { label: "Tomorrow", value: addDays(now, 1) },
    { label: "In 2 days", value: addDays(now, 2) },
    { label: "Next week", value: addDays(now, 7) },
  ];

  // Reset to current time + 24h (default)
  const handleReset = () => {
    try {
      // Get current time
      const currentTime = new Date();
      // Add exactly 24 hours
      const defaultTime = new Date(currentTime.getTime() + 24 * 60 * 60 * 1000);

      // Ensure it's a valid date before setting
      if (isNaN(defaultTime.getTime())) {
        throw new Error("Invalid date created");
      }

      setDate(defaultTime);
      onChange(defaultTime);
    } catch (error) {
      console.error("Error resetting date:", error);
      // Fallback to current time if there's an error
      const fallbackTime = new Date();
      setDate(fallbackTime);
      onChange(fallbackTime);
    }
  };

  // Set date for quick date presets
  const handleQuickDateSelect = (selectedDate: Date) => {
    try {
      // Validate the input date
      if (!(selectedDate instanceof Date) || isNaN(selectedDate.getTime())) {
        throw new Error("Invalid preset date");
      }

      const updatedDate = new Date(selectedDate);
      updatedDate.setHours(date?.getHours() || now.getHours());
      updatedDate.setMinutes(date?.getMinutes() || 0);

      // Verify date is valid after changes
      if (isNaN(updatedDate.getTime())) {
        throw new Error("Invalid date after quick select");
      }

      setDate(updatedDate);
      onChange(updatedDate);
    } catch (error) {
      console.error("Error setting quick date:", error);
      // Use current date as fallback
      const fallback = new Date();
      setDate(fallback);
      onChange(fallback);
    }
  };

  // Set both date and time for next day presets
  const handleNextDayQuickSelect = (hours: number, minutes: number) => {
    try {
      // Validate input values
      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        throw new Error("Invalid time values for quick select");
      }

      const tomorrow = addDays(now, 1);
      const updatedDate = new Date(tomorrow);
      updatedDate.setHours(hours);
      updatedDate.setMinutes(minutes);

      // Verify the date is valid
      if (isNaN(updatedDate.getTime())) {
        throw new Error("Invalid date created for next day quick select");
      }

      setDate(updatedDate);
      onChange(updatedDate);
    } catch (error) {
      console.error("Error setting next day quick select:", error);
      // Use current time + 24 hours as fallback
      const fallback = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      fallback.setHours(hours < 0 || hours > 23 ? 12 : hours); // Default to noon if invalid hour
      fallback.setMinutes(minutes < 0 || minutes > 59 ? 0 : minutes);
      setDate(fallback);
      onChange(fallback);
    }
  };

  // Render the calendar that works for both drawer and popover
  const renderCalendar = () => (
    <div className="w-full flex items-center justify-center flex-col">
      <Calendar
        mode="single"
        selected={date}
        onSelect={handleDateChange}
        initialFocus
        disabled={(date) =>
          (isBefore(date, now) && date.getDate() !== now.getDate()) || isAfter(date, maxDate)
        }
        className="mx-auto max-w-full"
      />
      <div className="px-4 pt-1 pb-2">
        <p className="text-[10px] sm:text-xs text-muted-foreground">
          You can only book rides up to 2 months in advance.
        </p>
      </div>

      <div className="px-4 pb-2 flex flex-wrap gap-1.5">
        {quickSelectDates.map((preset) => (
          <Badge
            key={preset.label}
            className="cursor-pointer bg-primary hover:bg-primary/80 text-primary-foreground border-0 text-[10px] sm:text-xs py-1.5 px-2.5 rounded-md font-medium shadow-sm"
            onClick={() => {
              handleQuickDateSelect(preset.value);
              if (!isDesktop) setOpen(false);
            }}
          >
            {preset.label}
          </Badge>
        ))}
      </div>
    </div>
  );

  // Get formatted values for input fields
  const hourValue = React.useMemo(() => {
    if (!date || isNaN(date.getTime())) return "00";
    return date.getHours().toString().padStart(2, "0");
  }, [date]);

  const minuteValue = React.useMemo(() => {
    if (!date || isNaN(date.getTime())) return "00";
    return date.getMinutes().toString().padStart(2, "0");
  }, [date]);

  return (
    <Card className="w-full mx-auto border-2 rounded-xl shadow-md">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-t-xl p-4 sm:pb-4">
        <CardTitle className="text-lg sm:text-xl font-semibold flex items-center gap-2">
          <CalendarClock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          Schedule Your Ride
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:gap-6 p-4 sm:p-6">
        {/* Time selection pills */}
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs sm:text-sm font-medium">Quick Select for Tomorrow</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-7 sm:h-8 gap-1 text-xs"
              type="button"
            >
              <RotateCcw className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="hidden xs:inline">Reset to default</span>
              <span className="xs:hidden">Reset</span>
            </Button>
          </div>
          <div className="grid grid-cols-3 xs:grid-cols-3 sm:grid-cols-5 gap-1.5 sm:gap-2">
            {quickSelectTimes.map((time) => (
              <Button
                type="button"
                key={time.label}
                variant="outline"
                className="w-full text-[10px] xs:text-xs sm:text-sm relative overflow-hidden group h-14 xs:h-14 sm:h-12 px-0.5 xs:px-1 rounded-lg border-primary/10 hover:border-primary/30 transition-colors"
                onClick={() => handleNextDayQuickSelect(time.hours, time.minutes)}
              >
                <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors rounded-md" />
                <div className="relative flex flex-col items-center justify-center gap-1">
                  <time.icon className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 text-primary" />
                  <span className="font-medium">{time.label}</span>
                </div>
              </Button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Date picker - Desktop: Popover, Mobile: Drawer */}
          <div className="space-y-2 sm:space-y-3">
            <Label htmlFor="date" className="text-xs sm:text-sm font-medium">
              Date
            </Label>
            <div className="space-y-2">
              {isDesktop ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal text-xs sm:text-sm h-9 sm:h-10",
                        !date && "text-muted-foreground"
                      )}
                    >
                      {date && !isNaN(date.getTime()) ? (
                        format(date, "EEE, d MMM yyyy")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    {renderCalendar()}
                  </PopoverContent>
                </Popover>
              ) : (
                <Drawer open={open} onOpenChange={setOpen}>
                  <DrawerTrigger asChild>
                    <Button
                      type="button"
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal text-xs sm:text-sm h-9 sm:h-10",
                        !date && "text-muted-foreground"
                      )}
                    >
                      {date && !isNaN(date.getTime()) ? (
                        format(date, "EEE, d MMM yyyy")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader className="px-4 pt-4 pb-2 sm:pt-5 sm:pb-3">
                      <DrawerTitle className="text-base sm:text-lg">Pick a date</DrawerTitle>
                      <DrawerDescription className="text-xs mt-1">
                        Select when you need your ride
                      </DrawerDescription>
                    </DrawerHeader>
                    <div className="py-3 px-4 flex justify-center">{renderCalendar()}</div>
                  </DrawerContent>
                </Drawer>
              )}

              <div className="flex flex-wrap gap-1.5 md:hidden">
                {quickSelectDates.map((preset) => (
                  <Badge
                    key={preset.label}
                    className="cursor-pointer bg-primary hover:bg-primary/80 text-primary-foreground border-0 text-xs py-1.5 px-2.5 rounded-md font-medium shadow-sm"
                    onClick={() => handleQuickDateSelect(preset.value)}
                  >
                    {preset.label}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Time picker with keyboard input */}
          <div className="space-y-2 sm:space-y-3">
            <Label htmlFor="time" className="text-xs sm:text-sm font-medium">
              Time
            </Label>
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 bg-muted/30 p-2.5 rounded-lg border border-muted">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                <TimePickerInput
                  ref={hourInputRef}
                  picker="hours"
                  value={hourValue}
                  onChange={(value) => handleTimeChange(value, minuteValue)}
                  onRightFocus={() => minuteInputRef.current?.focus()}
                  aria-label="Hour"
                  className="bg-background border-muted focus-visible:ring-primary"
                />
                <span className="text-sm sm:text-base font-medium text-muted-foreground">:</span>
                <TimePickerInput
                  ref={minuteInputRef}
                  picker="minutes"
                  value={minuteValue}
                  onChange={(value) => handleTimeChange(hourValue, value)}
                  onLeftFocus={() => hourInputRef.current?.focus()}
                  aria-label="Minute"
                  className="bg-background border-muted focus-visible:ring-primary"
                />
                <span className="ml-1 text-[10px] sm:text-xs text-muted-foreground font-medium bg-muted/50 px-1.5 py-0.5 rounded-sm">
                  24h
                </span>
              </div>

              <div className="mt-1 sm:mt-2 flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground italic">
                    Use keyboard arrows ↑↓ to change values
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-1 sm:mt-2 bg-primary/5 p-2.5 sm:p-3 rounded-lg border border-primary/10 shadow-sm">
          <p className="text-xs sm:text-sm flex items-start gap-1.5 sm:gap-2">
            <CalendarClock className="h-3.5 w-3.5 sm:h-4 sm:w-4 mt-0.5 text-primary" />
            <span>
              <strong>Scheduled:</strong>{" "}
              {date && !isNaN(date.getTime())
                ? `${format(date, "EEE d MMM")} at ${format(date, "HH:mm")}`
                : "No date selected"}
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
