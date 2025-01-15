import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast";

interface ContactFormProps {
  onAddContact: (phone: string, countryCode: string) => Promise<void>
}

export default function ContactForm({ onAddContact }: ContactFormProps) {
  const [phone, setPhone] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (phone) {
      try {
        setIsLoading(true)
        await onAddContact(phone, "")
        setPhone("")
        toast({
          title: "Success",
          description: "Contact added successfully!",
        })
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "An unexpected error occurred",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="phone">Contact Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Enter phone number"
          className="w-full"
        />
      </div>
      <Button type="submit" disabled={isLoading || !phone}>
        {isLoading ? "Adding..." : "Add Contact"}
      </Button>
    </form>
  )
}

