"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, ArrowRight, User, Mail, Phone, Lock, CheckCircle } from 'lucide-react'

interface MultiStepRegisterFormProps {
  onSubmit: (name: string, phone: string, email: string, password: string) => Promise<void>
  isLoading: boolean
}

export function MultiStepRegisterForm({ onSubmit, isLoading }: MultiStepRegisterFormProps) {
  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleNext = () => {
    if (step === 3 && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }
    setStep((prev) => prev + 1)
  }

  const handleBack = () => setStep((prev) => prev - 1)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }
    try {
      await onSubmit(formData.name, formData.phone, formData.email, formData.password)
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError("An unexpected error occurred")
      }
    }
  }

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
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={(e) => updateFormData("phone", e.target.value)}
                className="pl-9"
                required
              />
            </div>
          </div>
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
        </div>
      ),
    },
    {
      title: "Create Password",
      description: "Choose a secure password",
      fields: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={(e) => updateFormData("password", e.target.value)}
                className="pl-9"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type="password"
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
              I agree to the <a href="/terms-of-service" className="text-primary hover:underline">Terms of Service</a> and <a href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</a>
            </Label>
          </div>
        </div>
      ),
    },
  ]

  return (
    <form onSubmit={handleSubmit}>
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ x: 10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -10, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="w-[350px]">
            <CardHeader>
              <CardTitle>{steps[step].title}</CardTitle>
              <CardDescription>{steps[step].description}</CardDescription>
            </CardHeader>
            <CardContent>
              {steps[step].fields}
              {error && <p className="text-sm text-destructive mt-2">{error}</p>}
            </CardContent>
            <CardFooter className="flex justify-between">
              {step > 0 && (
                <Button type="button" variant="outline" onClick={handleBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
              )}
              {step < steps.length - 1 ? (
                <Button type="button" onClick={handleNext} className="ml-auto">
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={isLoading || !agreedToTerms} className="ml-auto">
                  {isLoading ? (
                    <>
                      <motion.div
                        className="animate-spin mr-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        ◌
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
    </form>
  )
}