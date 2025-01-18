'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from './ui/input';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from './ui/command';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LocationInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface Prediction {
  place_id: string;
  description: string;
}

export function LocationInput({ value, onChange, placeholder }: LocationInputProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const debounceTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const fetchPredictions = async (input: string) => {
    try {
      setError(null);
      const response = await fetch(`/api/places/autocomplete?input=${encodeURIComponent(input)}`);
      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setPredictions([]);
        return;
      }

      setPredictions(data.predictions || []);
    } catch (error) {
      console.error('Error fetching predictions:', error);
      setError('שגיאה בטעינת הצעות המיקום');
      setPredictions([]);
    }
  };

  const handleInputChange = (input: string) => {
    setInputValue(input);
    onChange(input);

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    if (input.length >= 2) {
      debounceTimeout.current = setTimeout(() => {
        fetchPredictions(input);
        setOpen(true);
      }, 300);
    } else {
      setPredictions([]);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="w-full">
          <Input
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={placeholder}
            className="w-full"
          />
        </div>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start">
        <Command>
          <CommandInput
            value={inputValue}
            onValueChange={handleInputChange}
            placeholder="חפש כתובת..."
          />
          {error ? (
            <CommandEmpty className="text-destructive">{error}</CommandEmpty>
          ) : predictions.length === 0 ? (
            <CommandEmpty>לא נמצאו תוצאות</CommandEmpty>
          ) : (
            <CommandGroup>
              {predictions.map((prediction) => (
                <CommandItem
                  key={prediction.place_id}
                  value={prediction.description}
                  onSelect={(value) => {
                    onChange(value);
                    setInputValue(value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === prediction.description ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {prediction.description}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
} 