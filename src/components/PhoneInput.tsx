import React from 'react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { Label } from "@/components/ui/label";

interface CustomPhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

const CustomPhoneInput: React.FC<CustomPhoneInputProps> = ({ value, onChange, label }) => {
  return (
    <div className="space-y-2">
      {label && <Label htmlFor="phone">{label}</Label>}
      <PhoneInput
        international
        defaultCountry="PT"
        value={value}
        onChange={onChange as (value: string | undefined) => void}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
};

export default CustomPhoneInput;

