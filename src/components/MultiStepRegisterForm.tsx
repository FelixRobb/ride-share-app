import { motion, AnimatePresence } from "framer-motion";
import { parsePhoneNumber } from "libphonenumber-js";
import { ArrowLeft, ArrowRight, User, Mail, Lock, CheckCircle, Loader } from "lucide-react";
import { useState } from "react";
import PhoneInput from "react-phone-number-input";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";

import "react-phone-number-input/style.css";

interface MultiStepRegisterFormProps {
  onSubmit: (name: string, phone: string, email: string, password: string) => Promise<void>;
  isLoading: boolean;
}

export function MultiStepRegisterForm({ onSubmit, isLoading }: MultiStepRegisterFormProps) {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<string>("");

  const evaluatePasswordStrength = (password: string) => {
    const lengthCriteria = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (password.length < 6) return "Too short";
    if (lengthCriteria && hasUppercase && hasNumber) return "Strong";
    if (lengthCriteria) return "Medium";
    return "Weak";
  };

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
    if (field === "password") {
      setPasswordStrength(evaluatePasswordStrength(value));
    }
  };

  const handleNext = () => {
    if (isStepValid(step)) {
      if (step === 2 && formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      setStep((prev) => prev + 1);
      setError(null);
    } else {
      setError("Please fill in all required fields");
    }
  };

  const handleBack = () => setStep((prev) => prev - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    try {
      const phoneNumber = parsePhoneNumber(formData.phone);
      if (!phoneNumber || !phoneNumber.isValid()) {
        throw new Error("Invalid phone number");
      }
      const e164PhoneNumber = phoneNumber.format("E.164");
      await onSubmit(formData.name, e164PhoneNumber, formData.email, formData.password);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unexpected error occurred");
      }
    }
  };

  const isStepValid = (stepIndex: number) => {
    switch (stepIndex) {
      case 0:
        return formData.name.trim() !== "";
      case 1:
        return formData.phone !== "";
      case 2:
        return (
          formData.email.trim() !== "" &&
          formData.password !== "" &&
          formData.confirmPassword !== ""
        );
      case 3:
        return agreedToTerms;
      default:
        return false;
    }
  };

  const steps = [
    {
      title: "Personal Information",
      description: "Let's start with your name",
      fields: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => updateFormData("name", e.target.value)}
                className="pl-9"
                required
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Contact Information",
      description: "How can we reach you?",
      fields: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <PhoneInput
              international
              defaultCountry="PT"
              value={formData.phone}
              onChange={(value) => {
                if (value) {
                  updateFormData("phone", value);
                } else {
                  updateFormData("phone", "");
                }
              }}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>
      ),
    },
    {
      title: "Account Information",
      description: "Set up your account",
      fields: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={(e) => updateFormData("email", e.target.value)}
                className="pl-9"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <PasswordInput
                id="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={(e) => updateFormData("password", e.target.value)}
                className="pl-9"
                required
              />
            </div>
            {formData.password && (
              <div className="relative">
                <div className="h-2 rounded bg-gray-200">
                  <div
                    className={`h-full rounded ${passwordStrength === "Strong" ? "bg-green-500" : passwordStrength === "Medium" ? "bg-yellow-500" : "bg-red-500"}`}
                    style={{
                      width:
                        passwordStrength === "Strong"
                          ? "100%"
                          : passwordStrength === "Medium"
                            ? "66%"
                            : passwordStrength === "Weak"
                              ? "33%"
                              : "0%",
                    }}
                  />
                </div>
                <p
                  className={`text-sm mt-1 ${passwordStrength === "Strong" ? "text-green-500" : passwordStrength === "Medium" ? "text-yellow-500" : "text-red-500"}`}
                >
                  {passwordStrength}
                </p>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <PasswordInput
                id="confirmPassword"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => updateFormData("confirmPassword", e.target.value)}
                className="pl-9"
                required
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Terms and Conditions",
      description: "Please review and accept our terms",
      fields: (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="terms"
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
            />
            <Label
              htmlFor="terms"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I agree to the{" "}
              <a href="/terms-of-service" className="text-primary hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy-policy" className="text-primary hover:underline">
                Privacy Policy
              </a>
            </Label>
          </div>
        </div>
      ),
    },
  ];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        initial={{ x: 10, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -10, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="w-full max-w-[350px] mx-auto">
          <CardHeader>
            <CardTitle>{steps[step].title}</CardTitle>
            <CardDescription>{steps[step].description}</CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            {steps[step].fields}
            {error && <p className="text-sm text-destructive mt-2">{error}</p>}
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-2">
            {step > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="w-full sm:w-auto"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
            )}
            {step < steps.length - 1 ? (
              <Button
                type="button"
                onClick={handleNext}
                className="w-full sm:w-auto sm:ml-auto"
                disabled={!isStepValid(step)}
              >
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isLoading || !agreedToTerms}
                className="w-full sm:w-auto sm:ml-auto"
              >
                {isLoading ? (
                  <>
                    <motion.div
                      className="animate-spin mr-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <Loader />
                    </motion.div>
                    Registering...
                  </>
                ) : (
                  <>
                    Register <CheckCircle className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
