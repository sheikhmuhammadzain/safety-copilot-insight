import { useState } from "react";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { format, parse, isValid } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChartDateFilterProps {
  startDate?: Date;
  endDate?: Date;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  onClear: () => void;
}

export function ChartDateFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClear,
}: ChartDateFilterProps) {
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const [startInputValue, setStartInputValue] = useState("");
  const [endInputValue, setEndInputValue] = useState("");

  const hasFilters = startDate || endDate;

  // Handle manual date input
  const handleStartInputChange = (value: string) => {
    setStartInputValue(value);
    // Try to parse mm/dd/yyyy format
    const parsed = parse(value, "MM/dd/yyyy", new Date());
    if (isValid(parsed)) {
      onStartDateChange(parsed);
    }
  };

  const handleEndInputChange = (value: string) => {
    setEndInputValue(value);
    // Try to parse mm/dd/yyyy format
    const parsed = parse(value, "MM/dd/yyyy", new Date());
    if (isValid(parsed)) {
      onEndDateChange(parsed);
    }
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Start Date */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">Start Date</label>
        <Popover open={startOpen} onOpenChange={setStartOpen}>
          <div className="relative">
            <Input
              type="text"
              placeholder="mm/dd/yyyy"
              value={startDate ? format(startDate, "MM/dd/yyyy") : startInputValue}
              onChange={(e) => handleStartInputChange(e.target.value)}
              className="h-8 w-[140px] pr-8 text-xs"
            />
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-8 w-8 p-0 hover:bg-transparent"
              >
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
          </div>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={(date) => {
                onStartDateChange(date);
                setStartInputValue("");
                setStartOpen(false);
              }}
              captionLayout="dropdown"
              fromYear={2020}
              toYear={2030}
              initialFocus
            />
            <div className="flex items-center justify-between border-t px-3 py-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onStartDateChange(undefined);
                  setStartInputValue("");
                  setStartOpen(false);
                }}
                className="text-xs h-7"
              >
                Clear
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onStartDateChange(new Date());
                  setStartInputValue("");
                  setStartOpen(false);
                }}
                className="text-xs h-7"
              >
                Today
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* End Date */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">End Date</label>
        <Popover open={endOpen} onOpenChange={setEndOpen}>
          <div className="relative">
            <Input
              type="text"
              placeholder="mm/dd/yyyy"
              value={endDate ? format(endDate, "MM/dd/yyyy") : endInputValue}
              onChange={(e) => handleEndInputChange(e.target.value)}
              className="h-8 w-[140px] pr-8 text-xs"
            />
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-8 w-8 p-0 hover:bg-transparent"
              >
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
          </div>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={(date) => {
                onEndDateChange(date);
                setEndInputValue("");
                setEndOpen(false);
              }}
              captionLayout="dropdown"
              fromYear={2020}
              toYear={2030}
              initialFocus
              disabled={(date) => startDate ? date < startDate : false}
            />
            <div className="flex items-center justify-between border-t px-3 py-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onEndDateChange(undefined);
                  setEndInputValue("");
                  setEndOpen(false);
                }}
                className="text-xs h-7"
              >
                Clear
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onEndDateChange(new Date());
                  setEndInputValue("");
                  setEndOpen(false);
                }}
                className="text-xs h-7"
              >
                Today
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Clear All Button */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onClear();
            setStartInputValue("");
            setEndInputValue("");
          }}
          className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground mt-5"
        >
          <X className="h-3 w-3 mr-1" />
          Clear All
        </Button>
      )}
    </div>
  );
}
